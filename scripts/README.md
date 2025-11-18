# Scripts Documentation

This directory contains various scripts for deployment automation, version management, and Jira ticket handling.

## Version Dashboard Update Targets

The following targets are available to update the version dashboard:

```bash
# Update EU Staging Dashboard
nx run scripts:updateVersionDashboardEUSTG

# Update EU Production Dashboard
nx run scripts:updateVersionDashboardEUPROD

# Update NA Staging Dashboard
nx run scripts:updateVersionDashboardNASTG

# Update NA Production Dashboard
nx run scripts:updateVersionDashboardNAPROD
```

### Input Format

These targets expect a `versions.txt` file in the root directory with the following format:

```json
{
    "get-all-games-search": {
        "version": "0.11.6",
        "folder": "GetAllGamesSearchFunction"
    }
}
```

The script will:

1. Read the versions.txt file
2. For each entry, look up the `relComponent` in the specified folder's package.json
3. Update the version dashboard for the specified environment

### Important Notes

- Always verify the contents of versions.txt before running these targets
- These targets directly affect the version dashboard - use with caution
- For testing purposes, create a test environment configuration first

## Jira Ticket Creation Targets

The following targets are available to create Jira REL tickets for deployments:

```bash
# Create Jira tickets for EU deployments
nx run scripts:create-jira-tickets-eu

# Create Jira tickets for NA deployments
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
4. Create a Jira ticket via PATCH request to `http://nja.psnative.pgt.gaia/ticket`
5. Parse the API response to extract the ticket ID (REL-XXXXX format)
6. Update versions.json with `relTicket` property for each package
7. Pass the enhanced versions.json downstream as an artifact

### Jira Ticket Payload

For each package, a ticket is created with the following payload:

```json
{
    "deployable_name": "igaming_lobby_view_v3",
    "deployable_version": "0.15.0",
    "regions": ["eu"] // or ["caon1", "usnj1", "uspa1", "uspa1"] for NA
}
```

### API Response Format

The Jira API returns a text response with:

- **First line**: Ticket ID in REL-XXXXX format
- **Second line**: Link to the ticket (optional)

### Important Notes

- Jira ticket creation runs automatically after version dashboard updates in staging deployments
- If ticket creation fails, the pipeline will fail (unlike version dashboard updates)
- versions.json is updated with successful tickets even if some fail (partial success handling)
- Pipeline reruns automatically skip packages that already have `relTicket` property
- The enhanced versions.json with `relTicket` properties is passed downstream as an artifact
- Each environment (EU/NA) creates tickets for their respective regions
- Authentication uses `apikey: secret` header
- API response must be exactly 2 lines: ticket ID + link

### Pipeline Failure & Rerun Behavior

When ticket creation fails:

1. **Partial Success**: Successful tickets are saved to versions.json with `relTicket` property
2. **Pipeline Failure**: Pipeline fails if any ticket creation fails
3. **Rerun Optimization**: Pipeline reruns automatically skip packages with existing `relTicket`
4. **Only Retry Failures**: Only packages without tickets will be retried

**Example Rerun Scenario**:

- First run: Creates tickets for 3/5 packages, fails pipeline
- versions.json updated with 3 successful tickets
- Rerun: Skips 3 successful packages, only attempts 2 failed ones

## Jira Ticket Transition Targets

The following targets are available to transition Jira REL tickets through deployment states:

### Staging Pipeline Transitions

```bash
# Transition tickets to "Deploy to PP" state
nx run scripts:transition-jira-tickets-deploy-pp-eu
nx run scripts:transition-jira-tickets-deploy-pp-na

# Transition tickets to "PP Testing" state
nx run scripts:transition-jira-tickets-pp-testing-eu
nx run scripts:transition-jira-tickets-pp-testing-na
```

### Production Pipeline Transitions

```bash
# Transition tickets to "Resolved" state
nx run scripts:transition-jira-tickets-resolved-eu
nx run scripts:transition-jira-tickets-resolved-na

# Transition tickets to "Closed" state
nx run scripts:transition-jira-tickets-closed-eu
nx run scripts:transition-jira-tickets-closed-na
```

### Input Format

These targets expect a `versions.json` file with existing `relTicket` properties:

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
2. Extract all `relTicket` IDs from packages
3. Call the transition API for each ticket
4. Transition tickets to the specified state

### Transition API Details

For each ticket, a transition request is made:

- **URL**: `POST http://nja.psnative.pgt.gaia/ticket/{ticketId}/transition`
- **Headers**: `apikey: secret`
- **Payload**: `{ "state": "Deploy to PP" }`, `{ "state": "PP Testing" }`, `{ "state": "Resolved" }`, or `{ "state": "Closed" }`

### Valid States

**Staging Pipeline:**

- `"Deploy to PP"` - Transition ticket to deployment state
- `"PP Testing"` - Transition ticket to testing state

**Production Pipeline:**

- `"Resolved"` - Transition ticket to resolved state
- `"Closed"` - Transition ticket to final closed state

### Pipeline Integration

#### Staging Pipeline Flow

The transition targets run automatically in the staging pipeline:

1. **After Ticket Creation**: Transitions run after successful ticket creation
2. **Sequential Flow**: "Deploy to PP" → "PP Testing"
3. **Parallel Environments**: EU and NA transitions run independently
4. **Failure Handling**: Pipeline stops on any transition failure

```
create-jira-tickets-staging-eu → transition-deploy-pp-staging-eu → transition-pp-testing-staging-eu
create-jira-tickets-staging-na → transition-deploy-pp-staging-na → transition-pp-testing-staging-na
```

#### Production Pipeline Flow

The transition targets run automatically in the production pipeline:

1. **After Version Dashboard**: Transitions run after version dashboard updates
2. **Sequential Flow**: "Resolved" → "Closed"
3. **Parallel Environments**: EU and NA transitions run independently
4. **Failure Handling**: Jobs allow failure but throw error exit codes (shows exclamation mark in GitLab CI)

```
update-version-dashboard-prod-eu → transition-resolved-prod-eu → transition-closed-prod-eu
update-version-dashboard-prod-na → transition-resolved-prod-na → transition-closed-prod-na
```

### Complete State Flow

The complete Jira ticket state flow across both pipelines:

```
OPEN → Deploy to PP → PP Testing → Platform Approval → Platform Approved → Scheduled → Resolved → Closed
      └─ Staging Pipeline ─┘                                                              └─ Production Pipeline ─┘
```

### Important Notes

- **Staging transitions**: Pipeline fails immediately on any transition failure
- **Production transitions**: Jobs allow failure but throw error exit codes for visibility
- Each environment (EU/NA) has separate versions.json and ticket sets
- No ticket validation - assumes all `relTicket` IDs are valid
- Transitions use the same authentication as ticket creation
- Production transitions require FSM extension in nja-rel-pipelines-v3 to support SCHEDULED → RESOLVED → CLOSED flow

## Jira Ticket Comment Targets

The following targets are available to add deployment comments to Jira REL tickets after deployment:

### Staging Pipeline Comments

```bash
# Add deployment comments for staging environment
nx run scripts:comment-jira-tickets-staging-eu
nx run scripts:comment-jira-tickets-staging-na
```

### Production Pipeline Comments

```bash
# Add deployment comments for production environment
nx run scripts:comment-jira-tickets-production-eu
nx run scripts:comment-jira-tickets-production-na
```

### Input Format

These targets expect a `versions.json` file with existing `relTicket` properties:

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
2. Extract all `relTicket` IDs and versions from packages
3. Call the comment API for each ticket with appropriate environment
4. Add deployment comments to tickets

### Comment API Details

For each ticket, a comment request is made:

**Staging Environment:**

- **URL**: `POST http://nja.psnative.pgt.gaia/ticket/{ticketId}/comment/ppc?additive=true`
- **Headers**: `apikey: secret`
- **Payload**: `{ "environment": "NPE", "deployable_version": "0.15.0" }`

**Production Environment:**

- **URL**: `POST http://nja.psnative.pgt.gaia/ticket/{ticketId}/comment/live?additive=true`
- **Headers**: `apikey: secret`
- **Payload**: `{ "environment": "production", "deployable_version": "0.15.0" }`

### Comment Format

Comments follow the standard deployment format:

```
Version 0.15.0 deployed to staging by Native Jira Automation.
Version 0.15.0 deployed to production by Native Jira Automation.
```

### Pipeline Integration

#### Staging Pipeline Flow

Comment targets run automatically after all transitions in the staging pipeline:

```
create-jira-tickets → transition-deploy-pp → transition-pp-testing → comment-staging
```

#### Production Pipeline Flow

Comment targets run automatically after all transitions in the production pipeline:

```
transition-resolved → transition-closed → comment-production
```

### Error Handling

- **Non-Blocking**: Comment failures do not stop the pipeline
- **Allow Failure**: Comment jobs use `allow_failure: true` in GitLab CI
- **Visible Warnings**: Failed comments show as yellow/warning in pipeline but don't block
- **Exit Codes**: Script exits with code 1 on failures to show warning status
- **Additive Comments**: Each deployment creates a new comment (not updated)

### Environment Mapping

The script automatically maps GitLab CI environment names to comment endpoints:

- `stg_eu00` / `stg_na03` → `/comment/ppc` (staging comments)
- `prod_eu00` / `prod_na03` → `/comment/live` (production comments)

### Important Notes

- Comments are additive - each deployment creates a new comment
- Comment failures are logged but don't fail the pipeline
- Uses `?additive=true` parameter to force new comment creation
- Same authentication as transitions and ticket creation
- Comments run after all transitions are complete
- Both EU and NA environments use the same comment format

## Jira Ticket Instruction Update Targets

The following targets are available to update deployment and rollback instructions on Jira REL tickets during staging pipeline:

### Staging Pipeline Instruction Updates

```bash
# Update deployment and rollback instructions for staging environment
nx run scripts:update-jira-instructions-eu
nx run scripts:update-jira-instructions-na
```

### Input Format

These targets expect a `versions.json` file with existing `relTicket` properties:

```json
{
    "get-bulk-game-data": {
        "version": "0.8.7",
        "folder": "GetBulkGameDataFunction",
        "relTicket": "REL-12345"
    }
}
```

The script will:

1. Read the versions.json file
2. Extract all `relTicket` IDs, versions, and folder names from packages
3. Read `relComponent` from each function's `package.json`
4. Generate deployment and rollback instructions using GitLab pipeline format
5. Call the instruction update API for each ticket
6. API automatically resolves rollback version using current live version from version dashboard

### Instruction API Details

For each ticket, an instruction update request is made:

- **URL**: `POST http://nja.psnative.pgt.gaia/ticket/{ticketId}/instructions`
- **Headers**: `apikey: secret`
- **Payload**:
    ```json
    {
        "deployment_instructions": "Deploying Manually from Gitlab Pipeline - go to Run a new pipeline against main branch https://gitlab.ballys.tech/excite/native/applications/personalised-lobby-ts-lambda-v3/-/pipelines/new\n\nAdd those environment variables:\n\nTARGET_VERSIONS_JSON with value - {\"get-bulk-game-data\":{\"version\":\"0.8.7\",\"folder\":\"GetBulkGameDataFunction\"}}\nTARGET_DEPLOY_ENVIRONMENTS with value - prod_eu00\n\nand then run the pipeline",
        "rollback_instructions": "Deploying Manually from Gitlab Pipeline - go to Run a new pipeline against main branch https://gitlab.ballys.tech/excite/native/applications/personalised-lobby-ts-lambda-v3/-/pipelines/new\n\nAdd those environment variables:\n\nTARGET_VERSIONS_JSON with value - {\"get-bulk-game-data\":{\"version\":\"{{ROLLBACK_VERSION}}\",\"folder\":\"GetBulkGameDataFunction\"}}\nTARGET_DEPLOY_ENVIRONMENTS with value - prod_eu00\n\nand then run the pipeline",
        "rel_component": "igaming_lobby_bulk_game_data_v3"
    }
    ```

### Instruction Format

Both deployment and rollback instructions follow the same GitLab pipeline format:

```
Deploying Manually from Gitlab Pipeline - go to Run a new pipeline against main branch https://gitlab.ballys.tech/excite/native/applications/personalised-lobby-ts-lambda-v3/-/pipelines/new

Add those environment variables:

TARGET_VERSIONS_JSON with value - {"package-key":{"version":"X.Y.Z","folder":"FunctionFolder"}}
TARGET_DEPLOY_ENVIRONMENTS with value - prod_eu00|prod_na03

and then run the pipeline
```

### Environment-Specific Details

The script automatically maps staging environments to production deployment targets:

- **EU Environment** (`stg_eu00`): Uses `prod_eu00` as TARGET_DEPLOY_ENVIRONMENTS
- **NA Environment** (`stg_na03`): Uses `prod_na03` as TARGET_DEPLOY_ENVIRONMENTS

### Rollback Version Resolution

1. **Deployment Instructions**: Use the current version from `versions.json`
2. **Rollback Instructions**:
    - Script sends placeholder `{{ROLLBACK_VERSION}}` to API
    - API extracts territory from ticket summary
    - API queries version dashboard using `relComponent` and territory
    - API replaces placeholder with actual current live version
    - If live version lookup fails, API uses `0.0.0` as fallback

### Pipeline Integration

#### Staging Pipeline Flow

Instruction update targets run automatically during the PP transition stage:

```
create-jira-tickets-staging → transition-deploy-pp-staging → update-jira-instructions-staging → transition-pp-testing-staging
```

The update runs:

- **After**: `transition-deploy-pp-staging-eu/na` (tickets are in PP state)
- **Before**: `transition-pp-testing-staging-eu/na` (before testing transition)
- **Stage**: During PP transition phase in staging pipeline only
- **Timing**: No production pipeline integration - only staging

### Error Handling

- **Non-Blocking**: Instruction update failures do not stop the pipeline
- **Allow Failure**: Update jobs use `allow_failure: true` in GitLab CI
- **Visible Warnings**: Failed updates show as yellow/warning in pipeline but don't block
- **Exit Codes**: Script exits with code 1 on failures to show warning status
- **Validation**: Validates relComponent exists in package.json before processing

### Required Function Configuration

Each function must have `relComponent` defined in its `package.json`:

```json
{
    "name": "get-bulk-game-data",
    "relComponent": "personalised-lobby-get-bulk-game-data",
    "version": "0.8.7"
}
```

### Field Mapping

The API updates two Jira custom fields:

- **Deployment Instructions**: `customfield_10013` (Changes Required field)
- **Rollback Instructions**: Currently mapped to rollback version field (may need adjustment)

### Important Notes

- **Staging Only**: Instruction updates only run during staging pipeline (PP transition phase)
- **Non-Blocking**: Failures show as warnings but don't stop pipeline progression
- **Version Dashboard Integration**: Rollback instructions automatically use current live versions
- **Environment Awareness**: Automatically maps staging environments to correct production targets
- **GitLab Pipeline URL**: Uses standardized GitLab pipeline URL for all lambdas
- **Package Key Format**: Uses package names from versions.json as TARGET_VERSIONS_JSON keys
- **Same Authentication**: Uses same API key as transitions and comments

## Functions Without REL Tickets

Some functions may not require REL (Release) tickets in the deployment pipeline. This could be because they are:

- Internal utility functions
- Development or testing functions
- Deprecated functions in maintenance mode
- Functions that are part of a larger component and don't need individual tracking

### Configuration

To mark a function as not needing REL tickets, add the `skipRelTicket` flag to its `package.json`. **Note: `relComponent` is still required for version dashboard tracking:**

```json
{
    "name": "my-function-name",
    "version": "1.0.0",
    "description": "Internal utility function",
    "relComponent": "igaming_lobby_my_function_v3",
    "skipRelTicket": true,
    "scripts": {
        "unit": "jest"
    }
}
```

### Behavior

When `skipRelTicket: true` is set:

- ✅ **Semantic versioning**: Function still gets versioned normally
- ✅ **Version dashboard update**: Function version is still tracked (requires `relComponent`)
- ⏭️ **JIRA ticket creation**: Skipped with clear logging
- ⏭️ **JIRA instruction updates**: Skipped with clear logging

### Error Handling

The pipeline scripts will show helpful error messages if configuration is incorrect:

```bash
# Missing relComponent (required for all functions)
Error: Missing relComponent property. Add "relComponent": "your_component_name" to package.json. Note: relComponent is required for version dashboard tracking even if function has "skipRelTicket": true

# Both relComponent and skipRelTicket present (warning, but valid)
⚠️  Warning: my-function has both relComponent and skipRelTicket=true. Using relComponent.
```

### When to Use

✅ **Use `skipRelTicket: true` when:**

- Function is for internal/development use only
- Function doesn't need release tracking
- Function is deprecated or in maintenance mode
- Function is a utility that doesn't directly serve customers

❌ **Don't use `skipRelTicket: true` when:**

- Function serves customer-facing features
- Function changes affect production behavior
- Function needs to be tracked for compliance/audit purposes
- You're unsure (default to requiring REL tickets)

### Migration

For existing functions that currently don't have `relComponent`:

1. **All functions need**: `relComponent` property (for version dashboard tracking)
2. **If they don't need REL tickets**: Also add `skipRelTicket: true`

### Pipeline Output

Functions marked with `skipRelTicket: true` will show in pipeline logs as:

```bash
⏭️  Skipping my-function-name - marked as skipRelTicket=true (no JIRA ticket needed)
⏭️  Skipping my-function-name - marked as skipRelTicket=true (no JIRA instruction update needed)
✓ my-function-name (igaming_lobby_my_function_v3 -> 1.0.0)  # Version dashboard still updated
```
