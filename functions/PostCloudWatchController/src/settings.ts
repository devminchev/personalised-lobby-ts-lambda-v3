// ---------------------------------------------------------------------------
// Breaker settings loader
// ---------------------------------------------------------------------------
//
// Resolves the six tunable knobs that govern the breaker's timing and
// retention policy (BreakerSettings). Source of truth is a single AWS Systems
// Manager Parameter Store parameter whose Value is a JSON document; per-process
// env-var overrides are honoured for tests, local development, and one-off
// operator overrides.
//
// ## Why one JSON parameter instead of six leaves
//
// The prior shape was one `AWS::SSM::Parameter` per setting under a shared
// prefix (`/personalised-lobby/${StageName}/breaker/<NAME>`), fetched with
// `GetParameters` (batch). That worked but didn't match the way the rest of
// the org provisions stage configuration via terraform — production parameters
// are managed by an external automation role and ship as a single JSON blob
// per environment (e.g. `personalisation-lobby-v2-breaker.json`).
//
// Collapsing to one parameter:
//   - one `GetParameter` round-trip instead of one `GetParameters` over six names,
//   - one ARN to scope IAM against,
//   - matches the terraform-provisioned shape so dev/playground and stg/prod
//     share a single configuration mental model.
//
// The chosen-option write-up (Parameter Store + SDK + cache, vs AppConfig and
// the Lambda Extension) is still in docs/resilience/configuration-store-decision.mdx;
// only the payload shape changed.
//
// ## Cache lifetime: 60 seconds
//
// Lambda freezes warm execution environments and reuses them. A pure
// "load once at module init" cache would mean a warm container keeps the
// snapshot it loaded at its own cold start until the container recycles
// (Lambda terminates environments "every few hours" per AWS docs). For a
// controller whose whole job is reacting to incidents — where an operator
// might `aws ssm put-parameter` a new threshold mid-incident — that staleness
// window is too long. 60 s is a deliberate compromise: a per-container
// refresh cadence that propagates changes within one minute while keeping
// SSM call volume to ~1 GetParameter per minute per warm container.
//
// ## Failure mode: fail loud
//
// Any error during loading (SSM throttle, missing parameter, malformed JSON,
// missing/non-numeric field, missing parameter-name env var) throws. There is
// intentionally no fallback to a hardcoded default. The controller is a
// control-plane Lambda whose async invocations are routed to a DLQ on failure
// (see template.yaml — the PostCloudWatchControllerDeadLetterQueue +
// ControllerErrorsAlarm). A silent fallback would mask real misconfiguration;
// failing loud surfaces it via the existing alarm path.
//
// ## Env-var overrides (BREAKER_* / STALE_EVENT_MS-equivalent)
//
// For each setting the loader checks an env var first. If every setting has
// an env-var override the SSM call is skipped entirely. This serves three
// purposes:
//   - Unit and e2e tests set env vars to skip SSM entirely (no mocking the
//     SSM client in every test case).
//   - Local development can run the bundle without IAM credentials for SSM.
//   - Operators can override a single value at deploy time (template
//     environment block) without touching SSM if needed.
//
// ## Validation
//
// All numeric values are validated for finiteness AND non-negativity. Zero is
// allowed because `staleEventMs=0` has documented meaning (disables the
// freshness guard). Negative values are rejected loudly: a negative duration
// would silently break breaker behaviour rather than fail visibly.

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { BreakerSettings } from './types';

const TTL_MS = 60_000;

interface CacheEntry {
    settings: BreakerSettings;
    loadedAt: number;
}

let cache: CacheEntry | null = null;
let ssmClient: SSMClient | null = null;

// Lazy + memoised. Building the client on first use (not at module load)
// keeps tests that never reach the SSM branch from instantiating an
// unused client, and matches the lazy pattern used by getDdbClient in db.ts.
function getClient(): SSMClient {
    ssmClient ??= new SSMClient({});
    return ssmClient;
}

interface SettingDef {
    field: keyof BreakerSettings;
    envVar: string;
    /** Key on the JSON document stored in the SSM parameter. */
    jsonKey: string;
}

// JSON keys use UPPER_SNAKE_CASE to match the externally-provisioned shape
// (see the screenshot in the PR / runbook): the document looks like
// `{ "OPEN_HOLD_MS": 60000, "HALF_OPEN_MAX_MS": 120000, ... }`. The `field`
// value stays camelCase because that is the TypeScript property name on
// BreakerSettings — TS convention drives the field; the external JSON shape
// drives the key.
const SETTING_DEFS: SettingDef[] = [
    { field: 'openHoldMs', envVar: 'BREAKER_OPEN_HOLD_MS', jsonKey: 'OPEN_HOLD_MS' },
    { field: 'halfOpenMaxMs', envVar: 'BREAKER_HALF_OPEN_MAX_MS', jsonKey: 'HALF_OPEN_MAX_MS' },
    {
        field: 'healthyOkEventsToClose',
        envVar: 'BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE',
        jsonKey: 'HEALTHY_OK_EVENTS_TO_CLOSE',
    },
    { field: 'eventHistoryTtlSec', envVar: 'BREAKER_EVENT_HISTORY_TTL_SEC', jsonKey: 'EVENT_HISTORY_TTL_SEC' },
    { field: 'stateHistoryTtlSec', envVar: 'BREAKER_STATE_HISTORY_TTL_SEC', jsonKey: 'STATE_HISTORY_TTL_SEC' },
    { field: 'staleEventMs', envVar: 'BREAKER_STALE_EVENT_MS', jsonKey: 'STALE_EVENT_MS' },
];

/**
 * Validates a numeric value: must be finite and non-negative. Zero is allowed
 * because `staleEventMs=0` is a documented valid value that disables the
 * freshness guard (used by tests and the local-run path), and the same
 * applies to `signalMaxAgeMs=0` which disables zombie pruning. Negatives are
 * rejected loudly: a negative duration would silently break breaker behaviour
 * (e.g. an immediately-expired `holdUntil`) rather than fail visibly.
 */
function validateNumeric(field: string, n: number, source: string): number {
    if (!Number.isFinite(n)) {
        throw new TypeError(`Invalid numeric value for ${field} from ${source}: ${n}`);
    }
    if (n < 0) {
        throw new Error(`Negative value not allowed for ${field} from ${source}: ${n}`);
    }
    return n;
}

function parseNumeric(field: string, raw: string | number, source: string): number {
    return validateNumeric(field, Number(raw), source);
}

/**
 * Returns the current BreakerSettings. Cached for TTL_MS; outside the TTL the
 * cache is refreshed via SSM. Env-var overrides take precedence over SSM on
 * every refresh (so a deploy-time override remains effective).
 */
export async function loadBreakerSettings(): Promise<BreakerSettings> {
    if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.settings;

    // Pass 1: pull anything that has an env-var override. These settings are
    // taken directly. If every setting has an env-var override (the common
    // test case) the SSM call is skipped entirely.
    const resolved: Partial<BreakerSettings> = {};
    const remaining: SettingDef[] = [];
    for (const def of SETTING_DEFS) {
        const raw = process.env[def.envVar];
        if (raw !== undefined && raw.trim() !== '') {
            resolved[def.field] = parseNumeric(def.field, raw, `env:${def.envVar}`);
        } else {
            remaining.push(def);
        }
    }

    // Pass 2: fetch the JSON document and pick out anything not satisfied by
    // an env var. Single GetParameter call regardless of how many fields are
    // unresolved — the cost is identical whether we extract one key or six.
    if (remaining.length > 0) {
        const rawName = process.env.BREAKER_SETTINGS_PARAMETER_NAME;
        if (!rawName?.trim()) {
            throw new Error(
                'BREAKER_SETTINGS_PARAMETER_NAME env var is required when not all breaker settings ' +
                    'are overridden via per-setting env vars',
            );
        }
        const name = rawName.trim();

        const out = await getClient().send(new GetParameterCommand({ Name: name }));
        const value = out.Parameter?.Value;
        if (value === undefined || value.trim() === '') {
            throw new Error(`SSM did not return a value for breaker settings parameter ${name}`);
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(value);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to parse JSON in breaker settings parameter ${name}: ${message}`);
        }

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error(`Breaker settings parameter ${name} must be a JSON object, got ${typeof parsed}`);
        }

        const doc = parsed as Record<string, unknown>;
        for (const def of remaining) {
            const raw = doc[def.jsonKey];
            if (raw === undefined) {
                throw new Error(`Missing key "${def.jsonKey}" in breaker settings parameter ${name}`);
            }
            // Accept JSON numbers and numeric strings. The terraform-provisioned
            // shape uses unquoted numbers (per the screenshot in the runbook)
            // but a hand-edited document may quote them; both round-trip the
            // same through parseNumeric → Number().
            if (typeof raw !== 'number' && typeof raw !== 'string') {
                throw new Error(
                    `Invalid type for "${def.jsonKey}" in breaker settings parameter ${name}: ` +
                        `expected number or numeric string, got ${typeof raw}`,
                );
            }
            resolved[def.field] = parseNumeric(def.field, raw, `ssm:${name}#${def.jsonKey}`);
        }
    }

    // Derive signalMaxAgeMs from the freshly-loaded staleEventMs (or honour an
    // explicit SIGNAL_MAX_AGE_MS env override if set). It is NOT in SETTING_DEFS
    // because it is not independently fetched from SSM — it is a derived field
    // whose tunability lives entirely in `staleEventMs`. See the BreakerSettings
    // doc comment in src/types.ts for why it lives on settings rather than on
    // RuntimeConfig.
    //
    // Note: when staleEventMs=0 (and no SIGNAL_MAX_AGE_MS override) signalMaxAgeMs
    // is also 0 — pruneStaleSignals interprets that as "pruning disabled," which
    // matches the "disable freshness guards" intent of staleEventMs=0.
    const sigEnv = process.env.SIGNAL_MAX_AGE_MS;
    let signalMaxAgeMs: number;
    if (sigEnv !== undefined && sigEnv.trim() !== '') {
        signalMaxAgeMs = parseNumeric('signalMaxAgeMs', sigEnv, 'env:SIGNAL_MAX_AGE_MS');
    } else {
        // staleEventMs already passed validation above, so 2× of it is also
        // a finite non-negative number; no extra check needed.
        signalMaxAgeMs = (resolved.staleEventMs as number) * 2;
    }
    resolved.signalMaxAgeMs = signalMaxAgeMs;

    // At this point every field in BreakerSettings has been written into resolved
    // — six from env+SSM and one (signalMaxAgeMs) derived. The cast is sound
    // because the contract above guarantees full population.
    const settings = resolved as BreakerSettings;
    cache = { settings, loadedAt: Date.now() };
    return settings;
}

/**
 * Test-only escape hatch: drop the in-process cache so the next call to
 * loadBreakerSettings re-reads env vars / SSM. The 60 s TTL would otherwise
 * cause a test that mutates env vars between cases to silently get the prior
 * snapshot. Production code paths must not call this.
 */
export function _resetSettingsCacheForTests(): void {
    cache = null;
}
