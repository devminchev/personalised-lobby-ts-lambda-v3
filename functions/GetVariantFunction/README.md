# GetVariantFunction

This Lambda returns the currently active experiment variant for a member.
Path: `/variant/{sitename}/{memberid}`

The handler:

- normalises ventures via `patchVentureName`
- validates required path params with `checkRequestParams`
- fetches the variant document from OpenSearch through `getDocWithHandling`
- falls back to `unaffected` for missing, expired, or malformed records
- logs mismatches using `logMessage` and lets `errorResponseHandler` shape failures

## Local development

### Requirements

- Node version managed by the workspace (see root `.nvmrc`)
- `yarn install` performed at repo root
- Environment variables set for OpenSearch access (`HOST`, `OS_USER`, `OS_PASS`, `EXECUTION_ENVIRONMENT`)

The runtime depends on the shared `os-client` library exposed through the Lambda layer mount point `/opt/nodejs/node_modules/os-client`. Nx already maps this path for local TypeScript builds; no extra configuration is required unless the layer layout changes.

### Running tests

```sh
cd functions/GetVariantFunction
yarn unit
```

Tests mock OpenSearch with `nock` and track log calls to assert both success and failure paths (missing variant, expiry, venture mismatch, and upstream errors).

### Local invocation

SAM builds both the function and the `os-client` layer:

```sh
# from the repository root
sam build GetVariantFunction
sam local invoke "GetVariantFunction" \
  -e functions/GetVariantFunction/events/event.eu.json \
  --env-vars env.eu.json
```

Update the event payload and env file per environment. Ensure `HOST` points at a reachable OpenSearch endpoint (or locally mocked service) before invoking.﻿
