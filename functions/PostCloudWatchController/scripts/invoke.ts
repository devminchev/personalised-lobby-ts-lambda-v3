#!/usr/bin/env npx ts-node
//
// Manual invocation script for PostCloudWatchController via `sam local invoke`.
//
// Events are generated dynamically with the current timestamp so no manual
// editing of JSON files is needed.
//
// Usage:
//   npx ts-node scripts/invoke.ts --scenario <name> [options]
//   npx ts-node scripts/invoke.ts --list
//
// Options:
//   --scenario <name>   Scenario to run (see --list). Default: critical-alarm
//   --profile  <name>   AWS profile to pass to SAM. Default: lobby-playground
//   --env-vars <file>   Env-vars JSON file for SAM.   Default: env.eu.json
//   --template <path>   SAM template path.            Default: .aws-sam/build/template.yaml
//   --list              Print available scenarios and exit.
//   --dry-run           Print the generated event and SAM command without invoking.
//
// ## Examples:
//   npx ts-node scripts/invoke.ts --scenario critical-alarm
//   npx ts-node scripts/invoke.ts --scenario compound-warning
//   npx ts-node scripts/invoke.ts --scenario tick
//   npx ts-node scripts/invoke.ts --scenario full-incident   # runs 4 scenarios in sequence
//
// # List all scenarios
// npx ts-node scripts/invoke.ts --list

// # Trip the breaker with a critical alarm (current timestamp generated automatically)
// npx ts-node scripts/invoke.ts --scenario critical-alarm

// # Two warning alarms in sequence (compound severity → OPEN)
// npx ts-node scripts/invoke.ts --scenario compound-warning

// # Full incident lifecycle: trip → clear signal → tick × 2
// npx ts-node scripts/invoke.ts --scenario full-incident

// # Preview the generated event + SAM command without running
// npx ts-node scripts/invoke.ts --scenario tick --dry-run

// # Show filtered Lambda logs alongside the response
// npx ts-node scripts/invoke.ts --scenario critical-alarm --logs

// # Use a specific AWS profile or template
// npx ts-node scripts/invoke.ts --scenario tick --profile my-profile --template template.yaml

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Walk upward from cwd until we find samconfig.toml — that's the repo root. */
function findRepoRoot(): string {
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
        if (fs.existsSync(path.join(dir, 'samconfig.toml'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    throw new Error('Could not locate samconfig.toml — run this script from within the repo.');
}

const REPO_ROOT = findRepoRoot();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlarmDetail {
    alarmName: string;
    previousState: { value: string; timestamp: string; reason: string };
    state: { value: string; timestamp: string; reason: string };
    configuration: { metrics: [] };
}

interface ScenarioResult {
    scenarioName: string;
    event: unknown;
    response: unknown;
    logs: string;
    durationMs: number;
}

// ---------------------------------------------------------------------------
// Event builders — all use Date.now() so timestamps are always current
// ---------------------------------------------------------------------------

function now(): string {
    return new Date().toISOString();
}

function alarmEvent(detail: Omit<AlarmDetail, 'configuration'> & { account?: string }): unknown {
    const { account = '123456789012', ...rest } = detail;
    return {
        version: '0',
        id: `invoke-script-${Date.now()}`,
        source: 'aws.cloudwatch',
        account,
        time: now(),
        region: 'eu-west-1',
        resources: [`arn:aws:cloudwatch:eu-west-1:${account}:alarm:${rest.alarmName}`],
        'detail-type': 'CloudWatch Alarm State Change',
        detail: { ...rest, configuration: { metrics: [] } },
    };
}

function tickEvent(): unknown {
    return {
        version: '0',
        id: `invoke-script-tick-${Date.now()}`,
        source: 'aws.scheduler',
        account: '123456789012',
        time: now(),
        region: 'eu-west-1',
        'detail-type': 'Scheduled Recovery Tick',
        detail: {},
    };
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

interface Scenario {
    name: string;
    description: string;
    events: () => unknown[];
}

const SCENARIOS: Scenario[] = [
    {
        name: 'critical-alarm',
        description: 'Single critical alarm (os-search-rejections → ALARM). Trips breaker OPEN.',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'OK', timestamp: now(), reason: 'Was OK.' },
                state: {
                    value: 'ALARM',
                    timestamp: now(),
                    reason: 'Thread-pool search rejections exceeded threshold.',
                },
            }),
        ],
    },
    {
        name: 'ok-alarm',
        description: 'Clear a critical alarm (os-search-rejections → OK). Removes signal.',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM', timestamp: now(), reason: 'Was in alarm.' },
                state: { value: 'OK', timestamp: now(), reason: 'Threshold no longer exceeded.' },
            }),
        ],
    },
    {
        name: 'warning-p99',
        description: 'Single warning alarm (api-p99 → ALARM). Should NOT trip alone.',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK', timestamp: now(), reason: 'Below threshold.' },
                state: { value: 'ALARM', timestamp: now(), reason: 'p99 latency exceeded 2000 ms.' },
            }),
        ],
    },
    {
        name: 'warning-5xx',
        description: 'Single warning alarm (api-5xx → ALARM). Should NOT trip alone.',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'OK', timestamp: now(), reason: 'Below threshold.' },
                state: { value: 'ALARM', timestamp: now(), reason: '5xx error rate exceeded threshold.' },
            }),
        ],
    },
    {
        name: 'compound-warning',
        description: 'Two warning alarms in sequence. Second one should trip OPEN (compound severity).',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK', timestamp: now(), reason: 'Below threshold.' },
                state: { value: 'ALARM', timestamp: now(), reason: 'p99 latency exceeded 2000 ms.' },
            }),
            alarmEvent({
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'OK', timestamp: now(), reason: 'Below threshold.' },
                state: { value: 'ALARM', timestamp: now(), reason: '5xx rate exceeded threshold.' },
            }),
        ],
    },
    {
        name: 'tick',
        description: 'Scheduled recovery tick. Drives OPEN→HALF_OPEN or HALF_OPEN→CLOSED based on current DDB state.',
        events: () => [tickEvent()],
    },
    {
        name: 'full-incident',
        description:
            'Full cycle: critical alarm → OK signal clear → tick (×2). Shows complete OPEN→HALF_OPEN→CLOSED path.',
        events: () => [
            alarmEvent({
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'OK', timestamp: now(), reason: 'Was OK.' },
                state: { value: 'ALARM', timestamp: now(), reason: 'Rejections exceeded threshold.' },
            }),
            alarmEvent({
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM', timestamp: now(), reason: 'Was in alarm.' },
                state: { value: 'OK', timestamp: now(), reason: 'Rejections back below threshold.' },
            }),
            tickEvent(),
            tickEvent(),
        ],
    },
];

// ---------------------------------------------------------------------------
// SAM invocation
// ---------------------------------------------------------------------------

function writeTempEvent(event: unknown): string {
    const tmpFile = path.join(os.tmpdir(), `pcc-event-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(event, null, 2));
    return tmpFile;
}

interface InvokeOpts {
    profile: string;
    envVars: string;
    template: string;
    dryRun: boolean;
}

function invokeSam(event: unknown, opts: InvokeOpts): Omit<ScenarioResult, 'scenarioName' | 'event'> {
    const tmpFile = writeTempEvent(event);

    const args = [
        'local',
        'invoke',
        'PostCloudWatchControllerFunction',
        '-t',
        opts.template,
        '-e',
        tmpFile,
        '--env-vars',
        opts.envVars,
        '--profile',
        opts.profile,
    ];

    const cmd = `sam ${args.join(' ')}`;

    if (opts.dryRun) {
        console.log('\n[dry-run] Event:');
        console.log(JSON.stringify(event, null, 2));
        console.log('\n[dry-run] Command:');
        console.log(cmd);
        fs.unlinkSync(tmpFile);
        return { response: null, logs: '', durationMs: 0 };
    }

    const start = Date.now();
    const proc = spawnSync('sam', args, { encoding: 'utf-8', cwd: REPO_ROOT });
    const durationMs = Date.now() - start;

    fs.unlinkSync(tmpFile);

    if (proc.error) {
        throw new Error(`Failed to spawn sam: ${proc.error.message}`);
    }

    let response: unknown = null;
    const stdout = (proc.stdout ?? '').trim();
    if (stdout) {
        try {
            response = JSON.parse(stdout);
        } catch {
            response = stdout; // not JSON — show raw
        }
    }

    return { response, logs: proc.stderr ?? '', durationMs };
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function printResult(result: ScenarioResult, showLogs: boolean): void {
    console.log(`\n${BOLD}${CYAN}──── ${result.scenarioName} (${result.durationMs} ms) ────${RESET}`);
    console.log(`${GREEN}Response:${RESET}`);
    console.log(JSON.stringify(result.response, null, 2));

    if (showLogs && result.logs.trim()) {
        console.log(`\n${DIM}Logs:${RESET}`);
        const relevant = result.logs
            .split('\n')
            .filter(
                (l) =>
                    l.includes('[breaker]') || l.includes('CTRL_') || l.includes('BREAKER_') || /error|warn/i.test(l),
            )
            .join('\n');
        if (relevant) console.log(DIM + relevant + RESET);
    }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): {
    scenario: string;
    list: boolean;
    dryRun: boolean;
    profile: string;
    envVars: string;
    template: string;
    showLogs: boolean;
} {
    const args = process.argv.slice(2);
    const get = (flag: string) => {
        const i = args.indexOf(flag);
        return i !== -1 ? args[i + 1] : undefined;
    };
    const has = (flag: string) => args.includes(flag);

    return {
        scenario: get('--scenario') ?? 'critical-alarm',
        list: has('--list'),
        dryRun: has('--dry-run'),
        showLogs: has('--logs'),
        profile: get('--profile') ?? 'lobby-playground',
        envVars: get('--env-vars') ?? 'env.eu.json',
        template: get('--template') ?? '.aws-sam/build/template.yaml',
    };
}

async function main(): Promise<void> {
    const opts = parseArgs();

    if (opts.list) {
        console.log(`\n${BOLD}Available scenarios:${RESET}\n`);
        for (const s of SCENARIOS) {
            console.log(`  ${YELLOW}${s.name.padEnd(20)}${RESET} ${s.description}`);
        }
        console.log();
        return;
    }

    const scenario = SCENARIOS.find((s) => s.name === opts.scenario);
    if (!scenario) {
        console.error(`Unknown scenario "${opts.scenario}". Run with --list to see available scenarios.`);
        process.exit(1);
    }

    const events = scenario.events();
    console.log(
        `\n${BOLD}Running scenario: ${YELLOW}${scenario.name}${RESET} (${events.length} event${events.length > 1 ? 's' : ''})`,
    );
    console.log(DIM + scenario.description + RESET);

    const invokeOpts: InvokeOpts = {
        profile: opts.profile,
        envVars: opts.envVars,
        template: opts.template,
        dryRun: opts.dryRun,
    };

    for (let i = 0; i < events.length; i++) {
        const label = events.length > 1 ? `${scenario.name} [${i + 1}/${events.length}]` : scenario.name;
        const { response, logs, durationMs } = invokeSam(events[i], invokeOpts);
        printResult({ scenarioName: label, event: events[i], response, logs, durationMs }, opts.showLogs);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
