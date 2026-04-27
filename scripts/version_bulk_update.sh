#!/usr/bin/env bash
# Bulk version dashboard updater.
# Reads versions.json from stdin, resolves relComponent from each function's
# package.json, and calls version_update.sh per entry.
#
# Usage: cat versions.json | ./scripts/version_bulk_update.sh --environment=aws-stg-eu00

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source env.sh once — exports BUCKET, KEY, URL for all subsequent version_update.sh calls
source "$SCRIPT_DIR/env.sh"

# Parse --environment argument
ENV_NAME=""
for arg in "$@"; do
  case "$arg" in
    --environment=*) ENV_NAME="${arg#--environment=}" ;;
  esac
done

if [ -z "$ENV_NAME" ]; then
  echo "Error: --environment parameter is required" >&2
  echo "" >&2
  echo "Usage: cat versions.json | ./scripts/version_bulk_update.sh --environment=<env>" >&2
  echo "Example: cat versions.json | ./scripts/version_bulk_update.sh --environment=aws-stg-eu00" >&2
  echo "" >&2
  echo "Valid environments:" >&2
  echo "  - aws-stg-eu00" >&2
  echo "  - aws-prod-eu00" >&2
  echo "  - aws-stg-eu03" >&2
  echo "  - aws-prod-eu03" >&2
  echo "  - aws-stg-na03" >&2
  echo "  - aws-prod-na03" >&2
  exit 1
fi

# Read versions.json from stdin
INPUT="$(cat)"

# Validate input is a JSON object
if ! echo "$INPUT" | jq -e 'type == "object"' >/dev/null 2>&1; then
  echo "Error: Input must be a JSON object" >&2
  exit 1
fi

# Process each entry
TOTAL=0
SUCCESS=0
FAILED=0
SUCCESSFUL_ENTRIES=""
FAILED_ENTRIES=""

# Read keys into array to avoid word-splitting issues and subshell scoping
mapfile -t KEYS < <(echo "$INPUT" | jq -r 'keys[]')

for key in "${KEYS[@]}"; do
  TOTAL=$((TOTAL + 1))

  version=$(echo "$INPUT" | jq -r --arg k "$key" '.[$k].version')
  folder=$(echo "$INPUT" | jq -r --arg k "$key" '.[$k].folder')

  # Validate version format
  if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format \"$version\" for $key (expected x.y.z)" >&2
    FAILED=$((FAILED + 1))
    FAILED_ENTRIES="${FAILED_ENTRIES}  x ${key}: invalid version format\n"
    continue
  fi

  # Resolve relComponent from package.json
  pkg="functions/$folder/package.json"
  if [ ! -f "$pkg" ]; then
    echo "Error: package.json not found for $key at $pkg" >&2
    FAILED=$((FAILED + 1))
    FAILED_ENTRIES="${FAILED_ENTRIES}  x ${key}: package.json not found in ${folder}\n"
    continue
  fi

  relComponent=$(jq -r '.relComponent // empty' "$pkg")
  if [ -z "$relComponent" ]; then
    echo "Error: Missing relComponent in $pkg" >&2
    echo "  Add \"relComponent\": \"your_component_name\" to package.json." >&2
    echo "  Note: relComponent is required for version dashboard tracking even if function has \"skipRelTicket\": true" >&2
    FAILED=$((FAILED + 1))
    FAILED_ENTRIES="${FAILED_ENTRIES}  x ${key}: missing relComponent in package.json\n"
    continue
  fi

  # Warn if skipRelTicket is set (same as old script behavior)
  skipRelTicket=$(jq -r '.skipRelTicket // false' "$pkg")
  if [ "$skipRelTicket" = "true" ]; then
    echo "Warning: $folder has both relComponent and skipRelTicket=true. Using relComponent."
  fi

  echo ""
  echo "--- Processing: $key ---"
  echo "  Deploy key: $relComponent"
  echo "  Version: $version"
  echo "  Environment: $ENV_NAME"

  # Call version_update.sh (it will skip re-sourcing env.sh since BUCKET is already exported)
  if "$SCRIPT_DIR/version_update.sh" "$ENV_NAME" "$relComponent" "$version"; then
    SUCCESS=$((SUCCESS + 1))
    SUCCESSFUL_ENTRIES="${SUCCESSFUL_ENTRIES}  + ${key} (${relComponent} -> ${version})\n"
  else
    FAILED=$((FAILED + 1))
    FAILED_ENTRIES="${FAILED_ENTRIES}  x ${key} (${relComponent} -> ${version})\n"
  fi
done

# Summary
echo ""
echo "=== Update Summary ==="
echo ""
echo "Total: $TOTAL"
echo "Successful: $SUCCESS"
echo "Failed: $FAILED"

if [ $SUCCESS -gt 0 ]; then
  echo ""
  echo "Successful updates:"
  printf "%b" "$SUCCESSFUL_ENTRIES"
fi

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "Failed updates:"
  printf "%b" "$FAILED_ENTRIES"
  exit 1
fi

exit 0
