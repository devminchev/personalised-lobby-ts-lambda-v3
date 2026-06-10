# AGENTS.md — functions/

AWS Lambda functions. One folder per API endpoint, each an independent Nx project and yarn workspace. See the [root AGENTS.md](../AGENTS.md) for monorepo-wide commands and gates.

<!-- GENERATED:START -->

## Layout of a function package

```
functions/<Name>Function/
  app.ts            # handler entrypoint — exports `lambdaHandler`
  tests/*.test.ts   # Jest unit tests (testMatch: **/tests/*.test.ts)
  events/           # event.eu.json, event.na.json — SAM local invoke payloads
  jest.config.ts    # ts-jest preset; maps os-client → libs/OSClient source
  tsconfig.json     # extends ../../tsconfig.base.json
  project.json      # Nx project config (defines `name`, build/test/etc.)
  package.json      # workspace package; `name` matches project.json
  Makefile          # SAM build shim → scripts/sam-nx-build.js
  README.md         # contract, status codes, mermaid diagrams (most functions)
```

## Handler contract (must follow)

```ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => { /* ... */ };
```

- Named export `lambdaHandler`; SAM handler path is `app.lambdaHandler`.
- Separate business logic from AWS-specific code; keep handlers single-responsibility, stateless, idempotent.
- Cache external clients (OpenSearch, DynamoDB) **outside** the handler.
- Standardise errors to `{ "code": "<ErrorCode>", "message": "..." }`; never use `any` (use `unknown`); explicit return types. (See `.cursor/rules/ts.mdc`.)

## Commands (per function)

Project name = the `name` field in `project.json` (kebab-case, e.g. `get-games`), **not** the folder name.

| Task | Command |
| --- | --- |
| Test one function | `nx test <project-name>` |
| Lint (auto-fix) | `nx lint <project-name>` |
| Build (esbuild → `dist/functions/<Name>Function/app.cjs`) | `nx build <project-name>` |
| Local invoke (EU) | `sam build && nx sam-invoke-eu <project-name>` |
| Local invoke (NA) | `sam build && nx sam-invoke-na <project-name>` |
| Validate EU invoke output | `nx sam-invoke-validate-eu <project-name>` |

Invoke output is written to `test-output/<project>.invoke.<region>.out`.

## Adding a new function

1. Create `functions/<Name>Function/` with `app.ts`, `tests/`, `events/event.eu.json` (+ `event.na.json`), `jest.config.ts`, `tsconfig.json`, `project.json`, `package.json`.
2. Register the resource and its API event in [`template.yaml`](../template.yaml) (`Runtime: nodejs24.x`, `Handler: app.lambdaHandler`, `BuildMethod: esbuild`).
3. Add the endpoint row to the [root README.md](../README.md) table.
4. Import shared code from `os-client` (see [libs/AGENTS.md](../libs/AGENTS.md)).

## Gotchas

- A folder existing here does **not** mean the function is deployed — only those wired into `template.yaml` are. Check before assuming.
- Coverage gate (on `coverage` config): 80/70/80/80 (stmts/branches/fns/lines).
- Don't invoke via the `run` Nx target — its script is missing; use `sam-invoke-*`.

<!-- GENERATED:END -->

---
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
