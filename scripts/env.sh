#!/usr/bin/env bash
# Shared config for all version dashboard scripts – source this, don't execute it.

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Source .env if present (local dev); in CI, VD_* vars come from CI variables
if [ -f "$ENV_DIR/.env" ]; then
  set -a
  source "$ENV_DIR/.env"
  set +a
fi

echo "VD_AWS_ACCESS_KEY_ID: $VD_AWS_ACCESS_KEY_ID"
echo "VD_AWS_SECRET_ACCESS_KEY: $VD_AWS_SECRET_ACCESS_KEY"

# Use VD_* credentials if set; otherwise keep existing AWS_* (e.g. from CI runner)
if [ -n "${VD_AWS_ACCESS_KEY_ID:-}" ]; then
  export AWS_ACCESS_KEY_ID="$VD_AWS_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$VD_AWS_SECRET_ACCESS_KEY"
  if [ -n "${VD_AWS_DEFAULT_REGION:-}" ]; then export AWS_DEFAULT_REGION="$VD_AWS_DEFAULT_REGION"; fi
  # Clear anything that could conflict with explicit credentials
  unset AWS_SESSION_TOKEN
  unset AWS_PROFILE
  unset AWS_ROLE_ARN
  unset AWS_WEB_IDENTITY_TOKEN_FILE
fi

STACK_NAME="version-dashboard-stack"

echo "SET_AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "SET_AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
echo "SET_AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION"

export BUCKET="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='VersionsBucketName'].OutputValue" --output text)"

export KEY="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='VersionsObjectKey'].OutputValue" --output text)"

export URL="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='VersionsObjectUrl'].OutputValue" --output text)"

echo "BUCKET=$BUCKET"
echo "KEY=$KEY"
echo "URL=$URL"
