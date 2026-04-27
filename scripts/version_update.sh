#!/usr/bin/env bash
# Inputs: ENV_NAME (e.g. aws-stg-eu00), DEPLOY_KEY (e.g. igaming_lobby_game_config_v3), VERSION
# Three cases:
#   1) .environments[ENV_NAME][DEPLOY_KEY] exists → shift versions (previous = latest, latest = new)
#   2) .environments[ENV_NAME] exists but [DEPLOY_KEY] missing → add new artefact under that env
#   3) .environments[ENV_NAME] missing → create the env key and add the artefact
# Write back with If-Match (ETag) for optimistic concurrency.
# Example: ./version_update.sh aws-stg-eu00 igaming_lobby_game_config_v3 0.17.4
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source env.sh only if BUCKET is not already set (allows bulk caller to source once)
if [ -z "${BUCKET:-}" ]; then
  source "$SCRIPT_DIR/env.sh"
fi

: "${BUCKET:?set BUCKET}"
: "${KEY:?set KEY}"

ENV_NAME="${1:?usage: 02_update_version.sh <ENV_NAME> <DEPLOY_KEY> <VERSION>}"
DEPLOY_KEY="${2:?usage: 02_update_version.sh <ENV_NAME> <DEPLOY_KEY> <VERSION>}"
NEW_VERSION="${3:?usage: 02_update_version.sh <ENV_NAME> <DEPLOY_KEY> <VERSION>}"

command -v jq >/dev/null 2>&1 || { echo "jq is required"; exit 1; }

# 1) Get current ETag (optimistic lock)
ETAG="$(aws s3api head-object \
  --bucket "$BUCKET" --key "$KEY" \
  --query ETag --output text | tr -d '"')"

cur="$(mktemp)"
new="$(mktemp)"
trap 'rm -f "$cur" "$new"' EXIT

# 2) Download current JSON
aws s3api get-object --bucket "$BUCKET" --key "$KEY" "$cur" >/dev/null

# 3) Upsert: update existing record, or create env/artefact if missing
jq --arg env "$ENV_NAME" --arg k "$DEPLOY_KEY" --arg ver "$NEW_VERSION" '
  # ensure .environments and .environments[$env] exist
  .environments //= {}
  | .environments[$env] //= {}
  | if .environments[$env][$k] then
      # existing record → shift versions
      .environments[$env][$k] as $rec
      | .environments[$env][$k].previous_version = $rec.latest_version
      | .environments[$env][$k].previous_updated_at = $rec.latest_updated
      | .environments[$env][$k].latest_version = $ver
      | .environments[$env][$k].latest_updated = (now | todateiso8601)
    else
      # new artefact → fresh entry
      .environments[$env][$k] = {
        latest_updated: (now | todateiso8601),
        previous_updated_at: null,
        lambda_name: $k,
        latest_version: $ver,
        previous_version: null
      }
    end
' "$cur" > "$new"

# Grab the updated record for printing (before upload)
UPDATED_RECORD="$(jq -c --arg env "$ENV_NAME" --arg k "$DEPLOY_KEY" \
  '.environments[$env][$k]' "$new")"

# 5) Conditional overwrite (will fail with 412 if someone updated first)
set +e
aws s3api put-object \
  --bucket "$BUCKET" \
  --key "$KEY" \
  --body "$new" \
  --content-type "application/json" \
  --cache-control "no-cache" \
  --if-match "$ETAG" >/dev/null
rc=$?
set -e

if [[ $rc -ne 0 ]]; then
  echo "Update failed (likely concurrent write). Try again." >&2
  exit $rc
fi

# 6) Echo the newly updated record
echo "$UPDATED_RECORD" | jq .
