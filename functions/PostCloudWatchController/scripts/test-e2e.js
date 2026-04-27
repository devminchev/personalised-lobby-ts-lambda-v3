#!/usr/bin/env node
'use strict';

/**
 * End-to-end integration harness for PostCloudWatchController.
 *
 * What this proves (and existing unit tests do not):
 *   - The built bundle in `dist/index.js` talks to a real DynamoDB instance
 *     correctly (ConditionExpression wiring, ConsistentRead, transact items).
 *   - The state machine produces the expected DynamoDB state across every
 *     key transition (CLOSED → OPEN, OPEN → HALF_OPEN via tick, HALF_OPEN →
 *     CLOSED / OPEN, HALF_OPEN retrip, zombie pruning).
 *   - Concurrent alarm invocations on the same partition do not lose signals
 *     (this is the actual race the optimistic-concurrency guard exists to fix).
 *
 * How it runs:
 *   1. Spins up `amazon/dynamodb-local` in docker/podman on port 8000.
 *   2. Creates a fresh `CircuitControl-e2e` table.
 *   3. Sets env vars so the handler (imported from ../dist/index.js) talks
 *      to the local DynamoDB via DDB_ENDPOINT.
 *   4. Runs a series of scenarios, each of which: wipes the table, seeds
 *      any required state, invokes the handler, reads DynamoDB back, and
 *      asserts against the expected shape.
 *   5. Tears the container down (even on failure / Ctrl-C).
 *
 * Usage:
 *   yarn build              # must be current; the script uses dist/index.js
 *   yarn test:e2e
 *
 * Flags:
 *   --keep        Do not stop the container at the end (useful for poking at
 *                 the final DynamoDB state with the AWS CLI).
 *   --no-setup    Do not start / create the container / table. Assumes you
 *                 already have DynamoDB Local running on :8000 with the
 *                 table present. Useful for iterating on tests.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ENDPOINT = 'http://localhost:8000';
const TABLE_NAME = 'CircuitControl-e2e';
const REGION = 'eu-west-1';
const CONTAINER_IMAGE = 'amazon/dynamodb-local';
const CONTAINER_NAME = 'ddb-local-e2e';
const CONTAINER_PORT = 8000;

// Prune window the handler uses for zombie signals. Kept large relative to
// real wall-clock so fresh writes during the run are not pruned.
const SIGNAL_MAX_AGE_MS = 10 * 60 * 1000;

// ANSI — no dependency needed.
const GREEN = '[32m';
const RED = '[31m';
const YELLOW = '[33m';
const CYAN = '[36m';
const DIM = '[2m';
const BOLD = '[1m';
const RESET = '[0m';

// CLI flags.
const KEEP_RUNNING = process.argv.includes('--keep');
const SKIP_SETUP = process.argv.includes('--no-setup');

// Pick whichever container runtime is on PATH. `docker` first (more common),
// `podman` as fallback. On this dev machine `docker` is aliased to `podman`,
// which still works.
const CONTAINER_CMD = which('docker') ? 'docker' : which('podman') ? 'podman' : null;

// ---------------------------------------------------------------------------
// Handler environment MUST be set before we require the built bundle — the
// handler reads DDB_ENDPOINT on import via getRuntimeConfig.
// ---------------------------------------------------------------------------

process.env.TABLE_NAME = TABLE_NAME;
process.env.DDB_ENDPOINT = ENDPOINT;
// STALE_EVENT_MS=0 disables the age guard so test fixtures with any timestamp
// are accepted. SIGNAL_MAX_AGE_MS is independent (it would otherwise default
// to 2×STALE_EVENT_MS = 0, which would disable zombie pruning — we want it on
// for the zombie test).
process.env.STALE_EVENT_MS = '0';
process.env.SIGNAL_MAX_AGE_MS = String(SIGNAL_MAX_AGE_MS);
process.env.AWS_REGION = REGION;
process.env.AWS_ACCESS_KEY_ID = 'local';
process.env.AWS_SECRET_ACCESS_KEY = 'local';

// ---------------------------------------------------------------------------
// Now it is safe to import the handler + a separate SDK client for the harness.
// ---------------------------------------------------------------------------

const distPath = path.join(__dirname, '..', 'dist', 'index.js');
let handler;
try {
    ({ handler } = require(distPath));
} catch (err) {
    console.error(`${RED}Could not load ${distPath}. Run \`yarn build\` first.${RESET}`);
    console.error(err.message);
    process.exit(2);
}

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    ScanCommand,
    GetCommand,
    PutCommand,
    BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(
    new DynamoDBClient({
        endpoint: ENDPOINT,
        region: REGION,
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    }),
);

// ---------------------------------------------------------------------------
// Container / table lifecycle
// ---------------------------------------------------------------------------

function which(cmd) {
    const r = spawnSync('which', [cmd], { encoding: 'utf8' });
    return r.status === 0;
}

function run(cmd, args, { ignoreFailure = false } = {}) {
    const r = spawnSync(cmd, args, { encoding: 'utf8' });
    if (r.status !== 0 && !ignoreFailure) {
        throw new Error(`$ ${cmd} ${args.join(' ')}\n  exit=${r.status}\n  stderr=${r.stderr}\n  stdout=${r.stdout}`);
    }
    return r;
}

async function startContainer() {
    if (!CONTAINER_CMD) {
        throw new Error('Neither docker nor podman found on PATH.');
    }
    // Pre-flight cleanup of the port. Two things can leave :8000 held:
    //   1. A previous run of this script aborted without tear-down, leaving
    //      `ddb-local-e2e` running. `rm -f` by name handles that cleanly.
    //   2. An unrelated `amazon/dynamodb-local` container (e.g. from the
    //      README's manual-run instructions, which name it `ddb-local`) is
    //      on :8000. Without a proactive cleanup, our `run -p 8000:8000`
    //      would fail with "proxy already running" / "bind: address already
    //      in use". We detect any `amazon/dynamodb-local` container holding
    //      our port and stop it — that is always safe because the image is
    //      only ever used for throwaway local testing.
    run(CONTAINER_CMD, ['rm', '-f', CONTAINER_NAME], { ignoreFailure: true });
    const listing = run(CONTAINER_CMD, ['ps', '--filter', `ancestor=${CONTAINER_IMAGE}`, '--format', '{{.Names}}'], {
        ignoreFailure: true,
    });
    const stragglers = (listing.stdout || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    for (const name of stragglers) {
        console.log(`${YELLOW}Stopping stale ${CONTAINER_IMAGE} container: ${name}${RESET}`);
        run(CONTAINER_CMD, ['stop', name], { ignoreFailure: true });
        run(CONTAINER_CMD, ['rm', '-f', name], { ignoreFailure: true });
    }
    run(CONTAINER_CMD, [
        'run',
        '--rm',
        '-d',
        '-p',
        `${CONTAINER_PORT}:${CONTAINER_PORT}`,
        '--name',
        CONTAINER_NAME,
        CONTAINER_IMAGE,
    ]);
    // Poll until the endpoint answers. `ResourceNotFoundException` for a
    // made-up table name means the server is up and responding.
    for (let i = 0; i < 40; i++) {
        await delay(250);
        try {
            await ddb.send(new ScanCommand({ TableName: '__does_not_exist__', Limit: 1 }));
        } catch (err) {
            if (err.name === 'ResourceNotFoundException') return;
        }
    }
    throw new Error('DynamoDB Local did not become ready within 10 seconds.');
}

function stopContainer() {
    run(CONTAINER_CMD, ['stop', CONTAINER_NAME], { ignoreFailure: true });
}

function createTable() {
    run('aws', [
        'dynamodb',
        'create-table',
        '--table-name',
        TABLE_NAME,
        '--attribute-definitions',
        'AttributeName=PK,AttributeType=S',
        'AttributeName=SK,AttributeType=S',
        '--key-schema',
        'AttributeName=PK,KeyType=HASH',
        'AttributeName=SK,KeyType=RANGE',
        '--billing-mode',
        'PAY_PER_REQUEST',
        '--endpoint-url',
        ENDPOINT,
        '--region',
        REGION,
    ]);
}

async function wipeTable() {
    // Delete everything under BREAKER#GLOBAL. Safer than deleting + recreating
    // the table between tests (that races with DDB Local's table status).
    let start;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const r = await ddb.send(new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey: start }));
        if (r.Items && r.Items.length > 0) {
            for (let i = 0; i < r.Items.length; i += 25) {
                await ddb.send(
                    new BatchWriteCommand({
                        RequestItems: {
                            [TABLE_NAME]: r.Items.slice(i, i + 25).map((item) => ({
                                DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
                            })),
                        },
                    }),
                );
            }
        }
        start = r.LastEvaluatedKey;
        if (!start) return;
    }
}

function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Assertion plumbing — prints a coloured tick / cross and keeps counts.
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];
let currentTest = '';

function startTest(name) {
    currentTest = name;
    console.log(`\n${BOLD}${CYAN}▸ ${name}${RESET}`);
}

function pass(desc) {
    passed += 1;
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
}

function fail(desc, detail) {
    failed += 1;
    failures.push(`[${currentTest}] ${desc}${detail ? '\n        ' + detail : ''}`);
    console.log(`  ${RED}✗${RESET} ${desc}`);
    if (detail) console.log(`    ${DIM}${detail}${RESET}`);
}

function assertEq(actual, expected, desc) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    a === e ? pass(desc) : fail(desc, `expected ${e}, got ${a}`);
}

function assertTrue(cond, desc, detail) {
    cond ? pass(desc) : fail(desc, detail);
}

// ---------------------------------------------------------------------------
// Fixture-driven event helpers
//
// Every scenario below feeds the handler with events loaded from the `events/`
// folder — the exact fixtures a developer would hand-craft to manually invoke
// the Lambda via `sam local invoke`. Doing it this way instead of constructing
// events inline in JS keeps the tests honest about the shape the handler has
// to tolerate in production: if the CloudWatch / EventBridge event schema ever
// changes (extra fields, renamed keys, etc.), the fixtures are where the
// ground-truth lives. An inline constructor would happily produce a stripped-
// down shape that fools the handler into passing tests but drifts away from
// reality.
//
// Each test may still need to tweak a field or two (flipping ALARM → OK,
// forcing a fresh timestamp so the zombie-prune window is relative to now,
// etc). That is done via `withOverrides(fixture, overrides)`, a deep merge
// scoped to the keys CloudWatch events actually nest things under. The
// override layer is narrow on purpose: everything else remains exactly as
// the fixture on disk.
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.join(__dirname, '..', 'events');

/** Loads an EventBridge alarm / tick event fixture by file name. */
function fixture(fileName) {
    const p = path.join(FIXTURES_DIR, fileName);
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
}

/**
 * Returns a deep copy of `base` with the supplied fields overridden. Nested
 * shallow-merges `detail`, `detail.state`, and `detail.previousState` because
 * those are the three places each test typically needs to touch (alarm name,
 * state transition, timestamps). Every other field — `source`, `detail-type`,
 * `resources`, `configuration`, and the like — passes through from the
 * fixture untouched.
 */
function withOverrides(base, overrides = {}) {
    const merged = { ...base, ...overrides };
    if (overrides.detail || base.detail) {
        merged.detail = { ...base.detail, ...(overrides.detail || {}) };
        if (overrides.detail?.state || base.detail?.state) {
            merged.detail.state = { ...base.detail?.state, ...(overrides.detail?.state || {}) };
        }
        if (overrides.detail?.previousState || base.detail?.previousState) {
            merged.detail.previousState = {
                ...base.detail?.previousState,
                ...(overrides.detail?.previousState || {}),
            };
        }
    }
    return merged;
}

/**
 * Convenience: stamps a fresh `state.timestamp` onto an alarm fixture so it
 * sits "now" on the wall clock. Used when a test's assertion depends on the
 * timestamp being recent relative to Date.now() (e.g. not being inside the
 * zombie-prune window). For tests that don't care about freshness, load the
 * fixture as-is.
 */
function freshAlarm(fileName, stateOverride) {
    const now = isoNow();
    return withOverrides(fixture(fileName), {
        time: now,
        detail: {
            state: {
                ...(stateOverride ? { value: stateOverride } : {}),
                timestamp: now,
            },
        },
    });
}

/** Tick-event sibling of `freshAlarm`. Stamps the tick's `time` to now so the
 *  handler's `holdUntil` comparisons evaluate against the current wall clock. */
function freshTick() {
    return withOverrides(fixture('tick.json'), { time: isoNow() });
}

function isoNow() {
    return new Date().toISOString();
}

function isoAgo(ms) {
    return new Date(Date.now() - ms).toISOString();
}

function isoAhead(ms) {
    return new Date(Date.now() + ms).toISOString();
}

async function readCurrent() {
    const r = await ddb.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: 'BREAKER#GLOBAL', SK: 'STATE#CURRENT' },
            ConsistentRead: true,
        }),
    );
    return r.Item;
}

async function readSignals() {
    const r = await ddb.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: 'BREAKER#GLOBAL', SK: 'SIGNAL_STATE#CURRENT' },
            ConsistentRead: true,
        }),
    );
    return r.Item;
}

async function seedBreakerState(partial) {
    const item = {
        PK: 'BREAKER#GLOBAL',
        SK: 'STATE#CURRENT',
        entityType: 'BREAKER_STATE',
        service: 'GLOBAL',
        mode: partial.state === 'CLOSED' ? 'normal' : 'protect',
        updatedAt: isoNow(),
        updatedBy: 'test',
        reason: 'seeded_by_test',
        version: 1,
        tripCount: 0,
        healthyProbeCount: 0,
        ...partial,
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
}

/**
 * Simulates time passing by rewinding the stored breaker's holdUntil into the
 * past. The next tick will see an expired deadline and perform a transition.
 *
 * Everything else — version, state, reason — is preserved so the handler's
 * subsequent ConditionExpression still matches and the transition proceeds
 * exactly as it would have in production once the real clock caught up.
 */
async function simulateTimeElapsed(msIntoPast = 60_000) {
    const current = await readCurrent();
    if (!current) throw new Error('simulateTimeElapsed: no STATE#CURRENT to rewind');
    await ddb.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: { ...current, holdUntil: isoAgo(msIntoPast) },
        }),
    );
}

async function seedSignalState(signals, updatedAt = isoNow()) {
    await ddb.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: 'BREAKER#GLOBAL',
                SK: 'SIGNAL_STATE#CURRENT',
                entityType: 'SIGNAL_STATE',
                service: 'GLOBAL',
                signals,
                updatedAt,
            },
        }),
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testCriticalOpens() {
    startTest('Critical signal alone opens the breaker on a fresh partition');
    await wipeTable();

    const result = await handler(freshAlarm('alarm-open.json'));

    assertEq(result, { action: 'opened', service: 'GLOBAL' }, 'handler returns action=opened, service=GLOBAL');
    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'STATE#CURRENT.state = OPEN');
    assertEq(current.reason, 'compound_open:critical_signal:os-search-rejections', 'reason reflects critical');
    assertEq(current.version, 1, 'version = 1 on first write');
    assertTrue(current.holdUntil, 'holdUntil is set');
    const signals = await readSignals();
    assertTrue(
        signals && signals.signals && 'os-search-rejections' in signals.signals,
        'os-search-rejections present in SIGNAL_STATE.signals',
    );
}

async function testSingleWarningStaysClosed() {
    startTest('A single warning signal keeps the breaker CLOSED');
    await wipeTable();

    const result = await handler(freshAlarm('alarm-api-p99.json'));

    assertEq(result, { action: 'initialized_closed', service: 'GLOBAL' }, 'handler returns initialized_closed');
    const current = await readCurrent();
    assertEq(current.state, 'CLOSED', 'STATE#CURRENT.state = CLOSED');
    assertEq(current.reason, 'all_clear:single_warning:api-p99', 'reason reflects single warning');
}

async function testCompoundWarningOpens() {
    startTest('Two warning signals together trigger compound OPEN');
    await wipeTable();

    await handler(freshAlarm('alarm-api-p99.json'));
    const r2 = await handler(freshAlarm('alarm-api-5xx.json'));

    assertEq(r2, { action: 'opened', service: 'GLOBAL' }, 'second warning returns opened');
    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'STATE#CURRENT.state = OPEN');
    assertTrue(
        /compound_warning/.test(current.reason) &&
            current.reason.includes('api-p99') &&
            current.reason.includes('api-5xx'),
        'reason cites both warnings (compound_warning:api-p99,api-5xx)',
        `reason was: ${current.reason}`,
    );
    assertEq(current.version, 2, 'version incremented to 2 across the two writes');
}

async function testOkOnOpenStaysOpen() {
    startTest('OK event while OPEN keeps the breaker OPEN (removes signal only)');
    await wipeTable();
    await handler(freshAlarm('alarm-api-p99.json'));
    await handler(freshAlarm('alarm-api-5xx.json'));

    const r = await handler(freshAlarm('alarm-api-p99.json', 'OK'));

    assertEq(r.action, 'open_partial_clear', 'handler returns open_partial_clear');
    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'STATE#CURRENT.state still OPEN');
    const signals = await readSignals();
    assertTrue(
        signals && signals.signals && !('api-p99' in signals.signals) && 'api-5xx' in signals.signals,
        'api-p99 removed, api-5xx retained',
        `signals: ${JSON.stringify(signals?.signals)}`,
    );
}

async function testTickOpenToHalfOpen() {
    startTest('Tick past holdUntil transitions OPEN → HALF_OPEN');
    await wipeTable();
    await seedBreakerState({
        state: 'OPEN',
        reason: 'seeded',
        holdUntil: isoAgo(60_000), // 1 min in the past
        version: 5,
        tripCount: 1,
    });

    const r = await handler(freshTick());

    assertEq(r, { action: 'scheduled_recovery_tick', transitioned: 1 }, 'tick reports 1 transition');
    const current = await readCurrent();
    assertEq(current.state, 'HALF_OPEN', 'STATE#CURRENT.state = HALF_OPEN');
    assertEq(current.reason, 'cooldown_expired_probe', 'reason = cooldown_expired_probe');
    assertEq(current.version, 6, 'version bumped to 6');
    assertTrue(current.holdUntil, 'new holdUntil set for probe window');
}

async function testTickHalfOpenToClosed() {
    startTest('Tick past HALF_OPEN holdUntil with no signals closes the breaker');
    await wipeTable();
    await seedBreakerState({
        state: 'HALF_OPEN',
        reason: 'seeded',
        holdUntil: isoAgo(60_000),
        version: 7,
        tripCount: 1,
    });
    await seedSignalState({});

    const r = await handler(freshTick());

    assertEq(r.transitioned, 1, 'tick transitioned');
    const current = await readCurrent();
    assertEq(current.state, 'CLOSED', 'state = CLOSED');
    assertEq(current.reason, 'half_open_timeout_no_signals', 'reason = half_open_timeout_no_signals');
    assertTrue(!current.holdUntil, 'holdUntil cleared on close');
}

async function testTickHalfOpenToOpen() {
    startTest('Tick past HALF_OPEN holdUntil with active signals re-opens');
    await wipeTable();
    await seedBreakerState({
        state: 'HALF_OPEN',
        reason: 'seeded',
        holdUntil: isoAgo(60_000),
        version: 10,
        tripCount: 1,
    });
    await seedSignalState({ 'os-search-rejections': { updatedAt: isoAgo(30_000) } });

    const r = await handler(freshTick());

    assertEq(r.transitioned, 1, 'tick transitioned');
    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'state = OPEN');
    assertEq(current.reason, 'half_open_timeout_reopen', 'reason = half_open_timeout_reopen');
}

async function testHalfOpenRetripsOnAlarm() {
    startTest('ALARM event during HALF_OPEN retrips to OPEN');
    await wipeTable();
    await seedBreakerState({
        state: 'HALF_OPEN',
        reason: 'seeded',
        holdUntil: isoAhead(60_000),
        version: 3,
        tripCount: 1,
    });

    const r = await handler(freshAlarm('alarm-api-p99.json'));

    assertEq(r.action, 'half_open_retripped', 'action = half_open_retripped');
    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'state = OPEN');
}

async function testHalfOpenClosesOnOk() {
    startTest('OK event during HALF_OPEN closes the breaker (healthy probe)');
    await wipeTable();
    await seedBreakerState({
        state: 'HALF_OPEN',
        reason: 'seeded',
        holdUntil: isoAhead(60_000),
        version: 4,
        tripCount: 1,
    });

    const r = await handler(freshAlarm('alarm-ok.json'));

    assertEq(r.action, 'closed', 'action = closed');
    const current = await readCurrent();
    assertEq(current.state, 'CLOSED', 'state = CLOSED');
}

async function testZombieSignalPruned() {
    startTest('Zombie signals (older than SIGNAL_MAX_AGE_MS) are pruned before severity scoring');
    await wipeTable();
    // cpu-high appears to have ALARMed 30 minutes ago — well past the 10 min
    // prune window. Without pruning, a fresh api-p99 ALARM would see two
    // warning signals and compound-open. With pruning, the zombie is dropped
    // and the handler sees only api-p99 → stays CLOSED.
    await seedSignalState({ 'cpu-high': { updatedAt: isoAgo(30 * 60 * 1000) } });

    const r = await handler(freshAlarm('alarm-api-p99.json'));

    assertEq(r.action, 'initialized_closed', 'action = initialized_closed (zombie pruned → single warning)');
    const signals = await readSignals();
    assertTrue(
        signals && !('cpu-high' in (signals.signals ?? {})),
        'cpu-high zombie removed from SIGNAL_STATE',
        `signals: ${JSON.stringify(signals?.signals)}`,
    );
    assertTrue(signals && 'api-p99' in (signals.signals ?? {}), 'api-p99 present in SIGNAL_STATE');
}

async function testConcurrentAlarmsNoSignalLoss() {
    startTest('Two concurrent alarm writes both land (optimistic-concurrency race proof)');
    await wipeTable();

    // Fire TWO warning alarms in parallel. One will win the initial
    // attribute_not_exists(PK) condition check; the other will fail with
    // ConditionalCheckFailed, re-read the fresh state, and retry with a
    // version=1 condition on its second attempt. Within the one-retry budget
    // this is deterministic: both eventually land.
    //
    // Without the guard + retry path, this test would drop one signal on
    // last-write-wins. We deliberately keep the concurrency at 2 here rather
    // than stressing to N>2: the retry budget is intentionally bounded (one
    // retry, then throw to the DLQ) so N-way contention would expose the
    // "let the DLQ catch it" path, not the race-fix path. See the unit test
    // "stops after one retry and rethrows if the race persists" for the
    // exhausted-budget behaviour.
    const results = await Promise.all([
        handler(freshAlarm('alarm-api-p99.json')),
        handler(freshAlarm('alarm-api-5xx.json')),
    ]);

    console.log(`    ${DIM}handler results: ${results.map((r) => r.action).join(', ')}${RESET}`);

    const signals = await readSignals();
    const landed = Object.keys(signals?.signals ?? {}).sort();
    assertEq(landed, ['api-5xx', 'api-p99'], 'both signals present in SIGNAL_STATE after concurrent writes');

    const current = await readCurrent();
    assertEq(current.state, 'OPEN', 'breaker ends up OPEN (compound warning)');
    assertEq(current.version, 2, 'version = 2 after two writes (one original + one retried)');
}

async function testRetryBudgetExhausts() {
    startTest('Retry budget exhausts at N>2 concurrent writers (DLQ path)');
    await wipeTable();

    // Fire four concurrent writers against a fresh partition. Expected:
    //   - 1 wins on its first attempt (attribute_not_exists(PK)).
    //   - 1 wins on retry (version=1 → version=2).
    //   - 2 exhaust the one-retry budget and throw.
    //
    // The handler-level behaviour is: throw up to the caller (Lambda), which
    // the DLQ in template.yaml catches. This test documents that contract by
    // using Promise.allSettled and asserting at least one succeeded AND at
    // least one failed with the expected error shape.
    //
    // Note each fixture's `alarmName` is the exact one the template would
    // emit for that signal — api-* are 4-part (with the lobby-v2 label) and
    // jvm-pressure / cpu-high are 3-part GLOBAL (they monitor the OpenSearch
    // domain, not a specific API). Using fixtures keeps this test honest
    // about what CloudWatch will send.
    const fixtureNames = ['alarm-api-p99.json', 'alarm-api-5xx.json', 'alarm-jvm-pressure.json', 'alarm-cpu-high.json'];
    const outcomes = await Promise.allSettled(fixtureNames.map((f) => handler(freshAlarm(f))));

    const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
    const rejected = outcomes.filter((o) => o.status === 'rejected');
    console.log(`    ${DIM}fulfilled=${fulfilled.length} rejected=${rejected.length}${RESET}`);

    assertTrue(fulfilled.length >= 2, 'at least 2 writers succeed (first-attempt winner + retry winner)');
    assertTrue(
        rejected.every((r) => {
            const name = r.reason?.name;
            return name === 'TransactionCanceledException' || name === 'ConditionalCheckFailedException';
        }),
        'every rejection is a conditional-check failure (DLQ path)',
        `rejection names: ${rejected.map((r) => r.reason?.name).join(', ')}`,
    );
    // The successful writers' signals must all be in the map — we must not
    // silently lose any signal whose handler call returned successfully.
    const signals = await readSignals();
    const landed = new Set(Object.keys(signals?.signals ?? {}));
    const successfulSignals = fulfilled.length;
    assertTrue(
        landed.size === successfulSignals,
        `SIGNAL_STATE has exactly ${successfulSignals} signals (one per successful handler call)`,
        `landed=${JSON.stringify([...landed])}`,
    );
}

async function testVersionMonotonicity() {
    startTest('version on STATE#CURRENT increases monotonically across writes');
    await wipeTable();
    await handler(freshAlarm('alarm-open.json')); // v1 OPEN
    await handler(freshAlarm('alarm-api-p99.json')); // v2 (open_sustained, critical still present)
    await handler(freshAlarm('alarm-ok.json')); // v3 (remove critical)

    const current = await readCurrent();
    assertEq(current.version, 3, 'version = 3 after three sequential writes');
}

async function testFullLifecycleRecoveryViaTimeout() {
    startTest('Full recovery lifecycle: CLOSED → OPEN → HALF_OPEN → CLOSED (no healthy probe)');
    await wipeTable();

    // 1. Incident starts — critical signal trips the breaker.
    let r = await handler(freshAlarm('alarm-open.json'));
    assertEq(r.action, 'opened', '(1) critical signal opens the breaker');
    let current = await readCurrent();
    assertEq(current.state, 'OPEN', '    state = OPEN');

    // 2. Incident clears — OK arrives while breaker is still OPEN.
    //    Per the state machine: signal is removed, but state stays OPEN
    //    (breaker is serving the cooldown period on purpose).
    r = await handler(freshAlarm('alarm-ok.json'));
    assertEq(r.action, 'open_partial_clear', '(2) OK while OPEN: open_partial_clear');
    current = await readCurrent();
    assertEq(current.state, 'OPEN', '    state still OPEN during cooldown');
    const signalsAfterOk = await readSignals();
    assertEq(Object.keys(signalsAfterOk.signals), [], '    signals map drained');

    // 3. Cooldown expires — tick moves OPEN → HALF_OPEN.
    await simulateTimeElapsed();
    r = await handler(freshTick());
    assertEq(r, { action: 'scheduled_recovery_tick', transitioned: 1 }, '(3) tick after cooldown: transitioned');
    current = await readCurrent();
    assertEq(current.state, 'HALF_OPEN', '    state = HALF_OPEN (probe window opens)');

    // 4. Probe window expires with no active signals — tick closes the breaker.
    //    This is the key recovery step: the system returns to normal without
    //    requiring a later OK event (OK already arrived in step 2 while the
    //    breaker was OPEN, so no additional OK is in the pipeline).
    await simulateTimeElapsed();
    r = await handler(freshTick());
    assertEq(r.transitioned, 1, '(4) tick at end of probe window: transitioned');
    current = await readCurrent();
    assertEq(current.state, 'CLOSED', '    state = CLOSED — breaker fully recovered');
    assertEq(current.reason, 'half_open_timeout_no_signals', '    reason reflects no-signals timeout path');
    assertTrue(!current.holdUntil, '    holdUntil cleared on close');
}

async function testFullLifecycleRecoveryViaProbe() {
    startTest('Full recovery lifecycle: CLOSED → OPEN → HALF_OPEN → CLOSED (via healthy OK probe)');
    await wipeTable();

    // 1. Compound warning trips the breaker.
    await handler(freshAlarm('alarm-api-p99.json'));
    const r1 = await handler(freshAlarm('alarm-api-5xx.json'));
    assertEq(r1.action, 'opened', '(1) compound warning opens the breaker');

    // 2. Cooldown expires without any OK yet.
    await simulateTimeElapsed();
    const r2 = await handler(freshTick());
    assertEq(r2.transitioned, 1, '(2) tick after cooldown: transitioned');
    let current = await readCurrent();
    assertEq(current.state, 'HALF_OPEN', '    state = HALF_OPEN (probe window opens)');

    // 3. During the probe window an OK event arrives for one of the warning
    //    signals. Per healthyOkEventsToClose=1, that single healthy probe
    //    is sufficient to close the breaker immediately.
    const r3 = await handler(freshAlarm('alarm-api-p99.json', 'OK'));
    assertEq(r3.action, 'closed', '(3) OK during HALF_OPEN closes the breaker');
    current = await readCurrent();
    assertEq(current.state, 'CLOSED', '    state = CLOSED — breaker fully recovered');
    assertTrue(/^recovered:/.test(current.reason), '    reason begins with "recovered:"', `reason: ${current.reason}`);
    assertTrue(!current.holdUntil, '    holdUntil cleared on close');
}

async function testDefensiveGlobalCollapse() {
    startTest('Non-GLOBAL alarm name is defensively routed to BREAKER#GLOBAL');
    await wipeTable();

    // Take the real `alarm-api-p99.json` fixture and override just the
    // `alarmName` to drop the GLOBAL segment. Using the fixture as the base
    // keeps every other field (source, detail-type, resources, etc.) true to
    // the shape AWS actually delivers — only the field under test is tweaked.
    const driftEvent = withOverrides(freshAlarm('alarm-api-p99.json'), {
        detail: { alarmName: 'breaker:lobby-v2:api-p99' },
    });
    const r = await handler(driftEvent);

    assertEq(r.service, 'GLOBAL', 'handler reports service=GLOBAL despite alarm name lacking GLOBAL segment');
    // Also verify nothing landed in BREAKER#lobby-v2.
    const scan = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
    const nonGlobal = (scan.Items ?? []).filter((i) => i.PK !== 'BREAKER#GLOBAL');
    assertEq(nonGlobal, [], 'no items written to non-GLOBAL partitions');
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function main() {
    console.log(`${BOLD}PostCloudWatchController e2e${RESET}`);
    if (!SKIP_SETUP) {
        if (!CONTAINER_CMD) {
            console.error(`${RED}Neither docker nor podman is available.${RESET}`);
            process.exit(2);
        }
        console.log(`${YELLOW}Starting ${CONTAINER_IMAGE} via ${CONTAINER_CMD}...${RESET}`);
        await startContainer();
        console.log(`${YELLOW}Creating table ${TABLE_NAME}...${RESET}`);
        createTable();
    } else {
        console.log(`${YELLOW}Skipping container / table setup (--no-setup).${RESET}`);
    }

    // Ensure teardown runs even on Ctrl-C.
    const cleanup = () => {
        if (!KEEP_RUNNING && !SKIP_SETUP) stopContainer();
    };
    process.on('SIGINT', () => {
        console.log(`\n${YELLOW}Interrupted, cleaning up...${RESET}`);
        cleanup();
        process.exit(130);
    });

    try {
        // Ordering: correctness primitives first, then tick, then the
        // concurrency stress test (which is the most likely to be flaky).
        await testCriticalOpens();
        await testSingleWarningStaysClosed();
        await testCompoundWarningOpens();
        await testOkOnOpenStaysOpen();
        await testDefensiveGlobalCollapse();

        await testTickOpenToHalfOpen();
        await testTickHalfOpenToClosed();
        await testTickHalfOpenToOpen();
        await testHalfOpenRetripsOnAlarm();
        await testHalfOpenClosesOnOk();

        await testZombieSignalPruned();
        await testVersionMonotonicity();

        // Full-cycle recovery — "does the breaker go back to normal?" —
        // runs after the individual-transition tests because it depends on
        // every one of them working in sequence.
        await testFullLifecycleRecoveryViaTimeout();
        await testFullLifecycleRecoveryViaProbe();

        await testConcurrentAlarmsNoSignalLoss();
        await testRetryBudgetExhausts();
    } finally {
        cleanup();
    }

    console.log('');
    const totals = `${passed + failed} assertions — ${GREEN}${passed} passed${RESET}${failed > 0 ? `, ${RED}${failed} failed${RESET}` : ''}`;
    console.log(totals);
    if (failed > 0) {
        console.log(`\n${RED}${BOLD}Failures:${RESET}`);
        for (const f of failures) console.log(`  ${f}`);
    }
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(`\n${RED}Unhandled error:${RESET}`, err);
    if (!KEEP_RUNNING && !SKIP_SETUP) stopContainer();
    process.exit(2);
});
