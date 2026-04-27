# PostCloudWatchController

Circuit breaker controller Lambda backed by DynamoDB. It consumes CloudWatch alarm state-change events, computes compound severity across active signals, and persists breaker posture into a single DynamoDB table.

## DynamoDB single-table schema + TypeScript controller Lambda

### Design:

- CloudWatch alarm state changes arrive on EventBridge when an alarm transitions
  state (edge-triggered), not on every evaluation period while it stays in the same state.
- This Lambda maintains a `SIGNAL_STATE#CURRENT` item per service that snapshots
  only the alarms that are currently active. On each incoming alarm event the map is updated,
  a compound severity score is computed, and the breaker posture decided from the
  aggregate -- not from the single incoming alarm alone.
- A scheduled tick (rate 1 min) drives timeout-based transitions (OPEN -> HALF_OPEN,
  HALF_OPEN -> CLOSED or HALF_OPEN -> OPEN) without needing a raw datapoint stream.
- The breaker itself persists three logical states: CLOSED, OPEN, and HALF_OPEN.
  The signal snapshot keeps only alarms that are still actively in ALARM.
- The key persisted records are: current breaker posture (`STATE#CURRENT`), breaker
  history (`STATE#<isoTs>`), current signal snapshot (`SIGNAL_STATE#CURRENT`), and
  raw alarm event audit entries (`EVENT#<isoTs>#<alarmName>`). Together these let
  the function reason about compound health, recovery progression, and why a
  breaker decision was made.
- `SIGNAL_STATE#CURRENT` is the authoritative view of what is currently in ALARM.
  Because CloudWatch alarms are edge-triggered, OK events for a given alarm may have
  arrived while the breaker was OPEN (before it entered HALF_OPEN). In that case no
  further OK events will fire during the HALF_OPEN probe window. The scheduled tick
  therefore consults `SIGNAL_STATE#CURRENT` at HALF_OPEN expiry to decide the outcome:
  if there are no active signals the breaker closes immediately; if signals are still
  present it re-opens. Reconstructing this from `ALARM_EVENT` audit records is not
  feasible — DynamoDB has no GROUP BY primitive and the scan would be unbounded.

### DynamoDB entity families (single table: `CircuitControl-<stage>`)

1. Current breaker posture
   PK = `BREAKER#<service>` SK = `STATE#CURRENT`
2. Breaker state history (TTL: 30 days)
   PK = `BREAKER#<service>` SK = `STATE#<isoTs>`
3. Signal snapshot (current active alarms per service)
   PK = `BREAKER#<service>` SK = `SIGNAL_STATE#CURRENT`
4. Alarm event audit (TTL: 14 days)
   PK = `BREAKER#<service>` SK = `EVENT#<isoTs>#<alarmName>`

### Compound severity policy

Critical signals (single signal triggers OPEN immediately):
os-search-rejections, os-write-rejections

Warning signals (two or more together trigger OPEN):
api-p99, api-5xx, jvm-pressure, cpu-high

Recovery:
OPEN + holdUntil expired (tick) -> HALF_OPEN
HALF_OPEN + OK + probeCount >= threshold (alarm event) -> CLOSED
HALF_OPEN + ALARM (any signal, alarm event) -> OPEN
HALF_OPEN + holdUntil expired, no active signals (tick) -> CLOSED
HALF_OPEN + holdUntil expired, active signals remain (tick) -> OPEN

Note on the last two transitions: because CloudWatch alarms are edge-triggered, OK
events may have arrived while the breaker was still OPEN. If all signals cleared before
the probe window started, no new OK events will fire during HALF_OPEN. The tick
therefore checks SIGNAL_STATE#CURRENT at expiry rather than assuming "no OK event
received = not recovered".

Alarm naming convention: `breaker:<service>:<signal>`
e.g. breaker:GLOBAL:os-search-rejections
breaker:GetGamesFunction:api-p99

Required IAM permissions:
dynamodb:GetItem, PutItem, UpdateItem, DeleteItem,
dynamodb:TransactWriteItems, dynamodb:BatchGetItem

Environment variables:
TABLE_NAME -- DynamoDB table name (required)

## Local development

Install dependencies and build the function:

```bash
yarn install
yarn build
```

Copy the sample env file before running locally:

```bash
cp env_example.json env.eu.json
```

The local env file is structured the same way as the personalised-lobby project: SAM injects environment variables per function from the JSON file at invoke time, rather than from a checked-in `.env` contract.

## Test locally with DynamoDB Local

The recommended local flow invokes the built bundle directly in Node against DynamoDB Local, using the controller's `DDB_ENDPOINT` env var to redirect DynamoDB traffic to the local instance. This avoids SAM's container networking complexity and keeps the endpoint override visible in `getRuntimeConfig`.

### 1. Start DynamoDB Local

```bash
yarn local:dynamodb
```

Exposes DynamoDB Local on `http://localhost:8000`.

### 2. Create the local table

Dummy credentials are fine for DynamoDB Local — it accepts anything but the AWS CLI still requires the env vars to be set.

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb create-table \
    --table-name CircuitControl-v2 \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

Optionally enable TTL for parity with the deployed stack:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb update-time-to-live \
    --table-name CircuitControl-v2 \
    --time-to-live-specification Enabled=true,AttributeName=ttl \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

### 3. Build and invoke the handler

```bash
yarn build
```

Invoke the handler directly with any event file. `DDB_ENDPOINT` is honoured by `getRuntimeConfig` → `getDdbClient` and redirects DynamoDB traffic to `localhost:8000`.

Alarm open event:

```bash
TABLE_NAME=CircuitControl-v2 \
STALE_EVENT_MS=0 \
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
DDB_ENDPOINT=http://localhost:8000 \
  node -e 'const { handler } = require("./dist/index.js");
           const e = require("./events/alarm-open.json");
           handler(e).then(r => console.log(JSON.stringify(r, null, 2)));'
```

Scheduled recovery tick:

```bash
TABLE_NAME=CircuitControl-v2 \
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
DDB_ENDPOINT=http://localhost:8000 \
  node -e 'const { handler } = require("./dist/index.js");
           const e = require("./events/tick.json");
           handler(e).then(r => console.log(JSON.stringify(r, null, 2)));'
```

`STALE_EVENT_MS=0` disables the freshness guard so the shipped fixtures (which have hardcoded timestamps) are always accepted.

### 4. Inspect the table contents

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb scan \
    --table-name CircuitControl-v2 \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

Query a single breaker:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb query \
    --table-name CircuitControl-v2 \
    --key-condition-expression "PK = :pk" \
    --expression-attribute-values '{":pk":{"S":"BREAKER#GLOBAL"}}' \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

You should see items with `SK` values like `STATE#CURRENT`, `SIGNAL_STATE#CURRENT`, and `EVENT#<timestamp>#<alarmName>`.

### Note on `sam local invoke`

`sam local invoke` is supported — the Lambda image will respect `DDB_ENDPOINT` passed via `--env-vars`. For macOS, set it to `http://host.docker.internal:8000` so the SAM container can reach the DynamoDB Local process running on the host.

## End-to-end integration test (`yarn test:e2e`)

`scripts/test-e2e.js` runs the **built bundle** against a real DynamoDB Local and asserts on the stored state after every scenario. It covers what unit tests cannot: actual `ConditionExpression` wiring, `ConsistentRead` behaviour, and concurrent handler invocations racing on a shared partition.

```bash
yarn test:e2e
```

The script will:

1. Start a `amazon/dynamodb-local` container on port 8000 (docker or podman, whichever is on PATH).
2. Create a throwaway `CircuitControl-e2e` table.
3. Require the handler from `dist/index.js` with `DDB_ENDPOINT` pointed at the container.
4. Run each scenario, wiping the table and/or seeding state between them:
    - CLOSED → OPEN on a critical signal
    - Single warning stays CLOSED
    - Compound warning opens
    - OK on an OPEN breaker clears the signal but keeps state OPEN
    - Non-GLOBAL alarm names are defensively routed to `BREAKER#GLOBAL`
    - Tick transitions: `OPEN → HALF_OPEN`, `HALF_OPEN → CLOSED/OPEN` depending on active signals
    - `HALF_OPEN` retrips on ALARM / closes on OK
    - Zombie signals older than `SIGNAL_MAX_AGE_MS` are pruned
    - Two concurrent writes on a fresh partition both land (optimistic-concurrency race proof)
    - Four concurrent writes: at least one exhausts the one-retry budget and throws — documents the DLQ path
5. Tear the container down (even on Ctrl-C / failure).

Flags:

- `--keep` — leaves the container running after the tests so you can poke at the final state with `aws dynamodb scan`.
- `--no-setup` — assumes DynamoDB Local is already running on `:8000` with the table present; useful when iterating on the script itself.

When inspecting DynamoDB Local after a `--keep` run, the AWS CLI still requires credentials to sign the request (even though the server does not check them). Prefix your commands with dummy creds or export them for the session:

```bash
export AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_REGION=eu-west-1

aws dynamodb scan --table-name CircuitControl-e2e --endpoint-url http://localhost:8000
aws dynamodb query --table-name CircuitControl-e2e \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"BREAKER#GLOBAL"}}' \
  --endpoint-url http://localhost:8000
```

Prerequisites:

- `dist/index.js` must be current — the yarn script runs `yarn build` first.
- `docker` or `podman` on PATH.
- `aws` CLI on PATH (used only for table creation; the rest uses the JS SDK already in `node_modules`).

If a test fails, the script prints the failure line, the expected vs actual value, and exits non-zero. The container is still torn down so nothing leaks between runs.

## Docker image

Build the Lambda container image for this project:

```bash
docker build -t post-cloud-watch-controller .
```

This Dockerfile is specific to PostCloudWatchController. It builds the TypeScript bundle with `yarn build` and packages the Lambda with handler `dist/index.handler`.

## Environment loading

Runtime configuration is resolved lazily inside the handler path rather than at module import time, so `sam local invoke --env-vars ...` injections are picked up correctly and tests can set env per-case without module caching getting in the way.

Environment variables:

- `TABLE_NAME` — required. Target DynamoDB table.
- `STALE_EVENT_MS` — optional. Drops alarm events older than this many ms; set to `0` to disable (useful for running the checked-in fixtures, whose timestamps are historical).
- `SIGNAL_MAX_AGE_MS` — optional. Signals unseen in `SIGNAL_STATE#CURRENT` for longer than this are pruned on the next evaluation. Defaults to `2 × STALE_EVENT_MS`.
- `AWS_REGION` — standard.
- `DDB_ENDPOINT` — optional. Redirects DynamoDB traffic (used only for local DynamoDB Local testing).
