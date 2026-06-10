# AGENTS.md — libs/

Shared libraries imported by the Lambda functions as normal dependencies (**not** Lambda Layers). See the [root AGENTS.md](../AGENTS.md) for monorepo-wide commands and gates.

<!-- GENERATED:START -->

## Libraries

| Folder | Package name | Purpose |
| --- | --- | --- |
| `OSClient/` | `os-client` | OpenSearch client, request/response helpers, types, contract validation, A/B testing, localization, compression — the main code reused across lambdas. |
| `dynamoClient/` | `dynamoClient` | DynamoDB client/entity helpers (`getDdbClient`, `buildEntities`) built on `dynamodb-toolbox`. |

`os-client` depends on `dynamoClient`. Both are tagged `type:lib`, `scope:pl` and versioned independently via `nx release`.

## How functions consume these

- Imported as a normal dependency: `import { ... } from 'os-client'`. Functions list `os-client` in their `project.json` `dependencies`.
- In Jest, `os-client` is mapped to source via `moduleNameMapper` (`^os-client$` → `libs/OSClient/index.ts`), so tests run against live lib source.
- Package entrypoint is the TypeScript source (`"main": "./index.ts"`, `"types": "./index.ts"`); esbuild bundles it at function build time.

## Layout

```
libs/OSClient/
  index.ts            # barrel export — public surface of os-client
  lib/                # osClient.ts, breakerClient.ts, gamesPayloads.ts,
                      # localization.ts, abTesting.ts, errors.ts, logger.ts,
                      # responseCompression.ts, personalisation/, ...
  tests/              # Jest unit tests
  project.json        # Nx project (name: os-client)
  CHANGELOG.md, README.md
libs/dynamoClient/
  index.ts
  lib/buildEntities.ts, getDdbClient.ts
  project.json        # Nx project (name: dynamoClient)
```

## Commands

| Task | Command |
| --- | --- |
| Build `os-client` | `nx build os-client` |
| Lint `os-client` | `nx lint os-client` |
| Test `os-client` | `nx test os-client` |
| Build `dynamoClient` | `nx build dynamoClient` |

Builds output to `dist/libs/<Lib>` (esbuild, `target: node24`, CJS bundle).

## Conventions

- Keep the public API in `index.ts` (barrel export); add new modules under `lib/`.
- Changing `os-client` affects many functions — run `yarn test:affected` / `yarn build:affected` to catch breakage across consumers.
- Functional style, explicit types, no `any`; mirror the rules in `.cursor/rules/ts.mdc`.
- Bump versions via conventional commits + `nx release` (independent per-lib versioning); `os-client` runs a `sync-versions` post-target.

<!-- GENERATED:END -->

---
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
