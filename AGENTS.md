# AGENTS.md

Personalised Lobby — the backend of the lobby. A collection of AWS Lambda functions providing personalization functionality for the frontend lobby. Nx-managed TypeScript monorepo; SAM is used for local testing only.

<!-- GENERATED:START — edit outside these markers to preserve on --update -->

## Project Map

| Path | What lives here | Scoped guide |
| --- | --- | --- |
| `functions/*` | One Lambda per API endpoint (`app.ts`, `tests/`, `events/`, `README.md`) | [functions/AGENTS.md](functions/AGENTS.md) |
| `libs/*` | Shared libraries (`os-client`, `dynamoClient`) imported as normal deps | [libs/AGENTS.md](libs/AGENTS.md) |
| `contracts/` | OpenAPI contracts for the lobby v3 API |  |
| `template.yaml` | SAM/CloudFormation template — defines all deployed AWS resources |  |
| `scripts/` | Build/deploy/SAM helper scripts (Node + shell) |  |
| `ci-scripts/` | GitLab CI child-pipeline + HCV scripts |  |
| `docs/` | Project documentation |  |

## Tech Stack (verified)

- **Language:** TypeScript `~5.9.3`, target `node24`, ES modules → bundled to CJS via esbuild.
- **Monorepo:** Nx `20.8.4`. All build/test/lint/release run through Nx targets defined in `nx.json` `targetDefaults`.
- **Package manager:** yarn `1.22.22` (workspaces: `functions/*`, `libs/*`). Use `yarn`, not npm.
- **Test:** Jest `29` via `@nx/jest` + `ts-jest`. Tests live in each project's `tests/*.test.ts`.
- **Quality:** ESLint `8` (`@typescript-eslint`), Prettier `3`. Pre-commit (`pre-commit` framework + husky) and yamllint.
- **Local invoke:** AWS SAM CLI (`sam build`, `sam local invoke`) — **local testing only**, not the build system.
- **CI/CD:** GitLab CI (`.gitlab-ci.yml`). Releases: per-project `nx release` (conventional commits, independent versioning).

## Commands

All build/repo management goes through Nx. Prefer `affected` variants in dev to limit scope.

| Task | All projects | Affected only |
| --- | --- | --- |
| Install | `yarn install` |  |
| Build | `yarn build` | `yarn build:affected` |
| Test | `yarn test` | `yarn test:affected` |
| Test + coverage | `yarn test:coverage` | `yarn test:coverage:affected` |
| Lint (auto-fixes) | `yarn lint` | `yarn lint:affected` |
| Format | `yarn format` | `yarn format:affected` |
| Docker build | `yarn docker:build` | `yarn docker:build:affected` |
| Dep graph | `yarn graph` |  |

- **Single project:** `nx <target> <project-name>` (project names are the `name` in each `project.json`, e.g. `get-games`, `os-client` — NOT the folder name).
- **Single test file:** `nx test <project-name>` runs that project's Jest suite (`tests/*.test.ts`).
- **SAM local invoke:** `nx sam-invoke-eu <project>` / `nx sam-invoke-na <project>` (writes to `test-output/`); validate with `nx sam-invoke-validate-eu <project>`. Run `sam build` first.
- **First-time setup:** `yarn setup` (install + nx reset + build + create `test-output/`).

## Quality Gates (enforced)

- **Coverage threshold** (on `--configuration=coverage`): statements 80, branches 70, functions 80, lines 80.
- **Commit messages:** conventional commits, enforced by commitlint (`commit-msg` hook).
- **pre-commit hook:** `prek run --all-files` + `lint-staged` (Prettier on staged files).
- **pre-push hook:** `prek` + `nx affected` lint/test/build + `sam build` + `sam-invoke-validate-eu` + `glab ci lint` (if `glab` installed). All must pass.

## Conventions (must follow)

- **Lambda handler:** export a named `lambdaHandler` (`export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>`). Handler path is `app.lambdaHandler`.
- **Shared code** goes in `libs/OSClient` (published internally as `os-client`) and is imported as a normal dependency — **not** as a Lambda Layer.
- **Resources** (functions, APIs, env vars, architecture) are defined in `template.yaml`. New endpoints require both a `functions/<Name>Function/` package and a `template.yaml` entry.
- Existing agent guidance lives in `.cursor/rules/*.mdc` (TS, SAM, Docker, DevOps, project) — treat as authoritative for code style.

## Gotchas (verified)

- The `run` Nx target references `scripts/run-lambda.sh`, which **does not exist** — use `sam-invoke-eu`/`sam-invoke-na` to invoke locally instead.
- Some function folders exist but are **not wired into `template.yaml`** (e.g. `GetBecauseYouPlayedFunction`, `GetAllGamesSearchFunctionV2`, `GetGameTitlesFunction`, `GetCachingTestFunction`) — confirm a function is deployed before assuming it's live (see `template.yaml`).
- `nx.json` `release.groups` select by tags `type:app` / `type:lib`; libs carry these tags but function `project.json` files currently have empty `tags` — verify before relying on release grouping.
- Jest maps `os-client` to the lib source via `moduleNameMapper`; Contentful packages are mocked in tests.

## See Also

- [README.md](README.md) — endpoint catalog (paths → functions) and architecture overview.
- [functions/AGENTS.md](functions/AGENTS.md), [libs/AGENTS.md](libs/AGENTS.md) — scoped guides.

<!-- GENERATED:END -->

---
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
