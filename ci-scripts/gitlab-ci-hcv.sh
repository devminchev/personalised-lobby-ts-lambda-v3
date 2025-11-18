#!/bin/bash

printf "\nAWS Credentials Job: Environment is $CI_ENVIRONMENT_NAME\n"
export hcv_token=$(curl -ks --request POST --data '{"role_id": "'"$approle_roleid"'", "secret_id": "'"$approle_secretid"'"}' $HCV_URL/$HCV_LOGIN_PATH | jq -r '.auth.client_token')
export aws_credentials=$(curl -ks -X POST --header "X-Vault-Token: $hcv_token" "$HCV_URL/v1/$HCV_STS_PATH/$AWS_ROLE_NAME?role_arn=$AWS_IAM_Role_ARN")

export AWS_ACCESS_KEY_ID=$(echo $aws_credentials | jq -r '.data.access_key')
export AWS_SECRET_ACCESS_KEY=$(echo $aws_credentials | jq -r '.data.secret_key')
export AWS_SESSION_TOKEN=$(echo $aws_credentials | jq -r '.data.security_token')
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "https://gitlab.ballys.tech/api/v4/projects/$GITLAB_PROJECT_ID/variables/AWS_ACCESS_KEY_ID?environment_scope=$CI_ENVIRONMENT_NAME&filter[environment_scope]=$CI_ENVIRONMENT_NAME"  --form "value=$AWS_ACCESS_KEY_ID" > /dev/null
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "https://gitlab.ballys.tech/api/v4/projects/$GITLAB_PROJECT_ID/variables/AWS_SECRET_ACCESS_KEY?environment_scope=$CI_ENVIRONMENT_NAME&filter[environment_scope]=$CI_ENVIRONMENT_NAME"  --form "value=$AWS_SECRET_ACCESS_KEY" > /dev/null
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "https://gitlab.ballys.tech/api/v4/projects/$GITLAB_PROJECT_ID/variables/AWS_SESSION_TOKEN?environment_scope=$CI_ENVIRONMENT_NAME&filter[environment_scope]=$CI_ENVIRONMENT_NAME"  --form "value=$AWS_SESSION_TOKEN" > /dev/null
