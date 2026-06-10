#!/bin/bash

SAFETY_MARGIN_SECONDS=300
GITLAB_VAR_BASE="https://gitlab.ballys.tech/api/v4/projects/$GITLAB_PROJECT_ID/variables"
ENV_SCOPE_QS="environment_scope=$CI_ENVIRONMENT_NAME&filter[environment_scope]=$CI_ENVIRONMENT_NAME"

printf "\nAWS Credentials Job: Environment is $CI_ENVIRONMENT_NAME\n"

existing_expiry_json=$(curl -ks --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE/AWS_CREDENTIAL_EXPIRY?$ENV_SCOPE_QS")
existing_expiry=$(echo "$existing_expiry_json" | jq -r '.value // empty' 2>/dev/null)

if [[ "$existing_expiry" =~ ^[0-9]+$ ]]; then
  now=$(date +%s)
  if [ "$((now + SAFETY_MARGIN_SECONDS))" -lt "$existing_expiry" ]; then
    printf "Existing AWS credentials still fresh (%ds remaining, %ds margin). Skipping refresh.\n" "$((existing_expiry - now))" "$SAFETY_MARGIN_SECONDS"
    exit 0
  fi
fi
printf "AWS credentials missing or near expiry; requesting fresh STS lease from Vault.\n"

export hcv_token=$(curl -ks --request POST --data '{"role_id": "'"$approle_roleid"'", "secret_id": "'"$approle_secretid"'"}' $HCV_URL/$HCV_LOGIN_PATH | jq -r '.auth.client_token')
export aws_credentials=$(curl -ks -X POST --header "X-Vault-Token: $hcv_token" "$HCV_URL/v1/$HCV_STS_PATH/$AWS_ROLE_NAME?role_arn=$AWS_IAM_Role_ARN")

export AWS_ACCESS_KEY_ID=$(echo $aws_credentials | jq -r '.data.access_key')
export AWS_SECRET_ACCESS_KEY=$(echo $aws_credentials | jq -r '.data.secret_key')
export AWS_SESSION_TOKEN=$(echo $aws_credentials | jq -r '.data.security_token')
lease_duration=$(echo $aws_credentials | jq -r '.lease_duration')
if ! [[ "$lease_duration" =~ ^[0-9]+$ ]] || (( lease_duration < 60 || lease_duration > 129600 )); then
  echo "Unexpected lease_duration from Vault: '$lease_duration'" >&2
  exit 1
fi
echo "Vault issued STS lease for ${lease_duration}s"
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE/AWS_ACCESS_KEY_ID?$ENV_SCOPE_QS"  --form "value=$AWS_ACCESS_KEY_ID" > /dev/null
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE/AWS_SECRET_ACCESS_KEY?$ENV_SCOPE_QS"  --form "value=$AWS_SECRET_ACCESS_KEY" > /dev/null
curl --request PUT --globoff --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE/AWS_SESSION_TOKEN?$ENV_SCOPE_QS"  --form "value=$AWS_SESSION_TOKEN" > /dev/null

new_expiry=$(( $(date +%s) + lease_duration - SAFETY_MARGIN_SECONDS ))
put_status=$(curl -ks --globoff -o /dev/null -w "%{http_code}" --request PUT --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE/AWS_CREDENTIAL_EXPIRY?$ENV_SCOPE_QS" --form "value=$new_expiry")
if [ "$put_status" = "404" ]; then
  curl -ks --globoff --request POST --header "PRIVATE-TOKEN: $CI_TOKEN" "$GITLAB_VAR_BASE" --form "key=AWS_CREDENTIAL_EXPIRY" --form "value=$new_expiry" --form "environment_scope=$CI_ENVIRONMENT_NAME" > /dev/null
fi
