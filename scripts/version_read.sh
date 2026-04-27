# Reads the versions.json via its public URL.
# With no args it pretty-prints the full JSON.
# With ENV_NAME and DEPLOY_KEY it prints only that deploy key's latest version.
# Example (full):     ./03_read_version.sh
# Example (filtered): ./03_read_version.sh STG section-games-lambda

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/env.sh"

ENV_NAME="${1:-}"
DEPLOY_KEY="${2:-}"

JSON="$(curl -fsSL "$URL")" || { echo "Public read failed (often account-level Block Public Access)"; exit 1; }

if [[ -n "$ENV_NAME" && -n "$DEPLOY_KEY" ]]; then
  echo "$JSON" | jq -r --arg env "$ENV_NAME" --arg dk "$DEPLOY_KEY" \
    '"\($dk): \(.environments[$env][$dk].latest_version // "not found")"'
else
  echo "$JSON" | jq .
fi
