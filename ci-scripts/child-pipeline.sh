#!/usr/bin/env bash

# Child Pipeline consisting of three stages: archive resource code, generate AWS credentials and Deploy on AWS
cat <<EOF
stages:
  - build
  - credentials
  - package
  - deploy_layer
  - deploy_lambda

default:
  image:
    name: python:3.8
  tags:
    - pgt-k8s-medium-v1

variables:
  HCV_URL: "https://vault.stg.root.pgt.gaia"
  HCV_LOGIN_PATH: "v1/auth/approle/login"
  GITLAB_GROUP_ID: "2296"

EOF

# Generate AWS credentials for every Gitlab Environment
for env in $2
do
cat <<EOF
${env}:aws_credentials:
  stage: credentials
  image:
    name: gamesys-native-docker-build.artifactory.gamesys.co.uk/native-node-20:latest
  environment: ${env}
  script:
    - . ci-scripts/gitlab-ci-hcv.sh
  needs: []
  rules:
    - if: '\$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH && \$CI_ENVIRONMENT_NAME =~ /prod*/'
      when: manual
      allow_failure: false
    - when: on_success
EOF
done

# Build code for every changed resource
for changed in $1
do
resource=$(echo $changed | cut -d'/' -f2)
cat <<EOF
'${resource}:sam_build':
  stage: build
  image:
    name: gamesys-native-docker-build.artifactory.gamesys.co.uk/native-node-20:latest
  when:
    on_success
  before_script:
    - echo "${ATG_NPM_CONFIG}" | base64 -d > /root/.npmrc
  script:
    - printf "\nBuild all lambdas and layers using SAM based on the template.yaml file\n"
    - sam build ${resource}
    - ls -l .aws-sam/build/*
  artifacts:
    paths:
    - .aws-sam/
EOF
done

# Package code for every changed resource and transfer to every AWS environment
for changed in $1
do
resource=$(echo $changed | cut -d'/' -f2)
for env in $2
do
cat <<EOF
'${env}:${resource}:package':
  stage: package
  image:
    name: gamesys-native-docker-build.artifactory.gamesys.co.uk/native-node-20:latest
  environment: ${env}
  when:
    on_success
  script:
    - printf "\nSAM package lambdas and layers to AWS S3\n"
    - aws s3 ls | grep lambdas
    - sam package ${resource} --s3-bucket \$AWS_S3_BUCKET --s3-prefix 'cicd/${resource}/$(date +"%Y-%m-%d-%H-%M-%S")' --output-template-file ./${resource}_package.json --use-json
    - cat ./${resource}_package.json
  artifacts:
    paths:
    - ./${resource}_package.json
  needs: [${resource}:sam_build, ${env}:aws_credentials]
EOF
done
done

# Deploy Lambda per environment using AWS CLI parsing S3 artifact from (SAM) package stage
for changed in $1
do
if [[ $(echo $changed | cut -d/ -f1) == "lambdas" ]]
then
resource=$(echo $changed | cut -d'/' -f2)
LAMBDA_NAME=$(head -n 1 "${changed}/.deployment")
for env in $2
do
cat <<EOF
'${env}:${resource}:deploy':
  stage: deploy_lambda
  image:
    name: gamesys-native-docker-build.artifactory.gamesys.co.uk/native-node-20:latest
  environment: ${env}
  variables:
    LAMBDA_FN_NAME: ${LAMBDA_NAME}
    state: ""
    status: ""
  when:
    on_success
  script:
    - |
      export aws_lambda_version=\$(aws lambda list-versions-by-function --function-name \$LAMBDA_FN_NAME --no-paginate --query "max_by(Versions, &to_number(to_number(Version) || '0'))" | jq '.Version' | tr -d '"')
      printf "\nLatest deployed version for Lambda Function \$LAMBDA_FN_NAME is v\$aws_lambda_version\n"

      export lambda_key=\$(cat ./${resource}_package.json | jq .Resources.${resource}.Properties.CodeUri | sed 's/["]//g' | cut -d/ -f 4-)
      aws lambda update-function-code --function-name \$LAMBDA_FN_NAME --s3-bucket \$AWS_S3_BUCKET --s3-key \$lambda_key --debug
      # Check if lambda function state is active and Last Update was Successful
      while true ; do
        sleep 1
        state=\$(aws lambda get-function --function-name \$LAMBDA_FN_NAME  --query 'Configuration.State' | tr -d '"')
        status=\$(aws lambda get-function --function-name \$LAMBDA_FN_NAME  --query 'Configuration.LastUpdateStatus' | tr -d '"')
        printf "\nChecking Lambda Function \$LAMBDA_FN_NAME State:\$state with Status:\$status"
        if [[ "\$state" == "Active" && "\$status" == "Successful" ]]; then
          printf "\nLambda Function ready for Publishing with version \$((aws_lambda_version+1))"
          aws lambda publish-version --function-name \$LAMBDA_FN_NAME --description "Gitlab CI Deployment for version \$((aws_lambda_version+1)) on \$(date +"%Y-%m-%d %H:%M:%S %Z")"
          break
        fi
      done
  needs: [${env}:${resource}:package, ${env}:aws_credentials]
EOF
done
fi
done

# Deploy Layer per environment using AWS CLI parsing S3 artifact from (SAM) package stage
for changed in $1
do
if [[ $(echo $changed | cut -d/ -f1) == "layers" ]]
then
resource=$(echo $changed | cut -d'/' -f2)
LAYER_NAME=$(head -n 1 "${changed}/.deployment")
for env in $2
do
cat <<EOF
'${env}:${resource}:deploy':
  stage: deploy_layer
  image:
    name: gamesys-native-docker-build.artifactory.gamesys.co.uk/native-node-20:latest
  environment: ${env}
  variables:
    LAYER_NAME: ${LAYER_NAME}
  when:
    on_success
  script:
    - |
      printf "\nListing Deployed Lambda Layers:\n"
      aws lambda list-layers | jq .Layers[].LayerName
      export aws_layer_version=\$(aws lambda list-layer-versions --layer-name \$LAYER_NAME --no-paginate --query "max_by(LayerVersions, &to_number(to_number(Version) || '0'))" | jq '.Version')
      printf "\nLatest deployed version for Layer: \$LAYER_NAME is v\$aws_layer_version\n"
      export layer_key=\$(cat ./${resource}_package.json | jq .Resources.${resource}.Properties.ContentUri | sed 's/["]//g' | cut -d/ -f 4-)
      printf "\nDeploying a new version for Lambda Layer: \$LAYER_NAME with version: \$((aws_layer_version+1)) \n"
      aws lambda publish-layer-version --layer-name \$LAYER_NAME --content S3Bucket=\$AWS_S3_BUCKET,S3Key=\$layer_key --description "Gitlab CI Deployment for version \$((aws_layer_version+1)) on \$(date +"%Y-%m-%d %H:%M:%S %Z")" > layer_publish.json

      cat layer_publish.json
      layer_version_arn=\$(cat layer_publish.json | jq .LayerVersionArn | sed 's/["]//g')
      lambdas=\$(cat ${changed}/.lambdas)
      for lambda in \$lambdas
      do
      printf "\nUpdate lambda function \$lambda using layer \$layer_version_arn"
      aws lambda update-function-configuration --function-name \$lambda --layers \$layer_version_arn
      # Check if lambda function state is active and Last Update was Successful
      while true ; do
        sleep 1
        state=\$(aws lambda get-function --function-name \$lambda  --query 'Configuration.State' | tr -d '"')
        status=\$(aws lambda get-function --function-name \$lambda  --query 'Configuration.LastUpdateStatus' | tr -d '"')
        printf "\nChecking Lambda Function \$lambda State:\$state with Status:\$status"
        if [[ "\$state" == "Active" && "\$status" == "Successful" ]]; then
          printf "\nLambda Function ready for Publishing)"
          aws lambda publish-version --function-name \$lambda --description "Gitlab CI Deployment triggered from deployment of Layer \$LAYER_NAME triggered  on \$(date +"%Y-%m-%d %H:%M:%S %Z")"
          break
        fi
      done
      done
  needs: [${env}:${resource}:package, ${env}:aws_credentials]
EOF
done
fi
done
