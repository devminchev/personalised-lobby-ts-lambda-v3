# Scripts Documentation

This directory contains various scripts for deployment automation, version management, and Jira ticket handling.

All JIRA ticket scripts use the **NJA CLI** (`nja` binary) from the NJA Docker image (`gamesys-native-docker-generic.artifactory.gamesys.co.uk/nja`). The CLI runs Express endpoints in-process via supertest — no external NJA server required.

**Required CI/CD variables:** `JIRA_URL`, `JIRA_USERNAME`, `JIRA_PASSWORD`

## Version Dashboard Update Targets

Version dashboard updates now run through `lbe-version-tracker` via:

```bash
npx --yes zx scripts/version_dashboard_update.mjs --environment=<aws-env>
```

Nx targets call this script for:

- `aws-stg-eu00`
- `aws-prod-eu00`
- `aws-stg-eu03`
- `aws-prod-eu03`

### Input Format

These targets expect a `versions.json` file in the repo root with object-keyed entries:

```json
{
    "get-all-games-search": {
        "version": "0.11.6",
        "folder": "GetAllGamesSearchFunction"
    }
}
```

The updater will:

1. Read `versions.json`
2. Resolve `relComponent` from `functions/<folder>/package.json`
3. Run `lbe-version-tracker update <environment> <relComponent> <version> --name <packageName>`

### CI Notes

- `lbe-version-tracker` is pre-installed in the `NODE_20` CI image
- Credentials/region come from GitLab CI variables: `VD_AWS_ACCESS_KEY_ID`, `VD_AWS_SECRET_ACCESS_KEY`, `VD_AWS_DEFAULT_REGION`
- Legacy bash scripts (`version_bulk_update.sh`, `version_update.sh`, `version_read.sh`, `env.sh`) were removed

## Jira Ticket Creation

Scripts can be run directly via node or via Nx targets:

```bash
# Direct (used by pipeline templates)
cat versions.json | node scripts/create-jira-tickets.js --environment=eu

# Via Nx targets
nx run scripts:create-jira-tickets-eu
nx run scripts:create-jira-tickets-eu03
nx run scripts:create-jira-tickets-na
```

### Input Format

These targets expect a `versions.json` file in the root directory with the following format:

```json
{
    "get-sections": {
        "version": "0.15.0",
        "folder": "GetViewFunction"
    }
}
```

After ticket creation, the file will be updated to:

```json
{
    "get-sections": {
        "version": "0.15.0",
        "folder": "GetViewFunction",
        "relTicket": "REL-12345"
    }
}
```

The script will:

1. Read the versions.json file
2. For each entry, look up the `relComponent` in the specified folder's package.json
3. Get the appropriate regions from `deployment-regions-config.json` based on environment
4. Create a Jira ticket via `nja ticket upsert --deployable-name <name> --deployable-version <ver> --region <codes...>`
5. Parse the CLI output to extract the ticket ID (REL-XXXXX format)
6. Update versions.json with `relTicket` property for each package
7. Pass the enhanced versions.json downstream as an artifact

### Pipeline Failure & Rerun Behavior

When ticket creation fails:

1. **Partial Success**: Successful tickets are saved to versions.json with `relTicket` property
2. **Pipeline Failure**: Pipeline fails if any ticket creation fails
3. **Rerun Optimization**: Pipeline reruns automatically skip packages with existing `relTicket`
4. **Only Retry Failures**: Only packages without tickets will be retried

## Jira Ticket Transitions

```bash
# Direct (used by pipeline templates)
cat versions.json | node scripts/transition-jira-tickets.js --state=deploy-pp

# Via Nx targets
nx run scripts:transition-jira-tickets-deploy-pp-eu
nx run scripts:transition-jira-tickets-pp-testing-eu
nx run scripts:transition-jira-tickets-deploying-eu
nx run scripts:transition-jira-tickets-resolved-eu
nx run scripts:transition-jira-tickets-closed-eu
```

### Valid States

- `deploy-pp` → "Deploy to PP"
- `pp-testing` → "PP Testing"
- `deploying` → "Deploying"
- `resolved` → "Resolved"
- `closed` → "Closed"

Each ticket is transitioned via `nja ticket transition <ticketId> --state "<state name>"`.

### Complete State Flow

```
OPEN → Deploy to PP → PP Testing → Platform Approval → Platform Approved → Scheduled → Deploying → Resolved → Closed
      └─ Staging Pipeline ─┘                                                                        └─ Production Pipeline ─┘
```

## Jira Ticket Comments

```bash
# Direct (used by pipeline templates)
cat versions.json | node scripts/comment-jira-tickets.js --environment=stg_eu00

# Via Nx targets
nx run scripts:comment-jira-tickets-staging-eu
nx run scripts:comment-jira-tickets-production-eu
```

### Environment Mapping

- `stg_eu00` / `stg_eu03` / `stg_na03` → `nja ticket comment-ppc` (staging/PPC comments, environment: NPE)
- `prod_eu00` / `prod_eu03` / `prod_na03` → `nja ticket comment-live` (production/live comments, environment: PROD)

### Error Handling

- **Non-Blocking**: Comment failures do not stop the pipeline
- **Allow Failure**: Comment jobs use `allow_failure: true` in GitLab CI

## Jira Ticket Instruction Updates

```bash
# Direct (used by pipeline templates)
cat versions.json | node scripts/update-jira-instructions.js --environment=stg_eu00

# Via Nx targets
nx run scripts:update-jira-instructions-eu
nx run scripts:update-jira-instructions-eu03
```

Instructions are updated via `nja ticket instructions <ticketId> --deployment-instructions <text> --rollback-instructions <text> --rel-component <comp> --deployment-env <env>`.

### Environment-Specific Details

The script maps staging CI environments to two different values:

- **NJA `--deployment-env`** (passed to the CLI for JIRA ticket fields):
    - `stg_eu00` → `aws-prod-eu00`
    - `stg_eu03` → `aws-prod-eu03`
    - `stg_na03` → `aws-prod-na03`
- **GitLab pipeline URL `TARGET_DEPLOY_ENVIRONMENTS`** (used in deployment/rollback instruction links):
    - `stg_eu00` → `prod_eu00`
    - `stg_eu03` → `prod_eu03`
    - `stg_na03` → `prod_na03`

### Rollback Version Resolution

1. **Deployment Instructions**: Use the current version from `versions.json`
2. **Rollback Instructions**: Script sends placeholder `{{ROLLBACK_VERSION}}` — API resolves it from the version dashboard

## Functions Without REL Tickets

Some functions may not require REL tickets. To skip, add `skipRelTicket: true` to `package.json`:

```json
{
    "name": "my-function-name",
    "version": "1.0.0",
    "relComponent": "igaming_lobby_my_function_v3",
    "skipRelTicket": true
}
```

When set:

- Semantic versioning and version dashboard tracking continue normally
- JIRA ticket creation and instruction updates are skipped
- Clear log messages indicate the skip
