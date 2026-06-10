/**
 * DynamoDB Toolbox — CircuitControl table analysis demo
 *
 * FOR LOCAL ANALYSIS ONLY — not imported by any Lambda code.
 *
 * Run (uses ts-node already in devDeps):
 *   CB_DDB_TABLE=CircuitControl-v2 AWS_PROFILE=lobby-playground AWS_REGION=eu-west-1 \
 *     yarn ts-node -e "require('ts-node/register'); require('./scripts/dynamo-toolbox-demo.ts')"
 *
 * Or with tsx if preferred:
 *   CB_DDB_TABLE=CircuitControl-v2 AWS_PROFILE=lobby-playground AWS_REGION=eu-west-1 \
 *     npx tsx scripts/dynamo-toolbox-demo.ts
 *
 * Point at DynamoDB Local instead of AWS:
 *   DDB_ENDPOINT=http://localhost:8000 CB_DDB_TABLE=CircuitControl-test npx tsx ...
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GetItemCommand } from 'dynamodb-toolbox/entity/actions/get';
import { QueryCommand } from 'dynamodb-toolbox/table/actions/query';
import { ScanCommand } from 'dynamodb-toolbox/table/actions/scan';
import { getEntities } from 'os-client';

// ---------------------------------------------------------------------------
// Client + entities
// ---------------------------------------------------------------------------

const ddbClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'eu-west-1',
        ...(process.env.DDB_ENDPOINT ? { endpoint: process.env.DDB_ENDPOINT } : {}),
    }),
);

const tableName = process.env.CB_DDB_TABLE ?? 'CircuitControl-v1';
const { table, BreakerStateEntity, SignalStateEntity, BreakerHistoryEntity, AlarmEventEntity } = getEntities(
    ddbClient,
    tableName,
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function hr(label: string) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(` ${label}`);
    console.log('─'.repeat(60));
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Current live breaker posture for a given service (default: GLOBAL). */
async function getCurrentState(service = 'GLOBAL') {
    hr(`Current breaker state — ${service}`);
    const { Item } = await BreakerStateEntity.build(GetItemCommand)
        .key({ PK: `BREAKER#${service}`, SK: 'STATE#CURRENT' })
        .send();

    if (!Item) {
        console.log('  (no item — breaker not yet initialised)');
        return;
    }
    console.log(JSON.stringify(Item, null, 2));
}

/** Active alarm signals currently in the signals map. */
async function getSignalState(service = 'GLOBAL') {
    hr(`Signal state — ${service}`);
    const { Item } = await SignalStateEntity.build(GetItemCommand)
        .key({ PK: `BREAKER#${service}`, SK: 'SIGNAL_STATE#CURRENT' })
        .send();

    if (!Item) {
        console.log('  (no item — no signals recorded yet)');
        return;
    }
    const signalCount = Object.keys(Item.signals ?? {}).length;
    console.log(`  ${signalCount} active signal(s):`, Object.keys(Item.signals ?? {}));
    console.log(JSON.stringify(Item, null, 2));
}

/**
 * Breaker state change history, newest-first.
 *
 * @example queryHistory('GLOBAL', { limit: 10 })
 * @example queryHistory('GLOBAL', { from: '2026-05-01T00:00:00Z', to: '2026-05-02T00:00:00Z' })
 */
async function queryHistory(service = 'GLOBAL', opts: { limit?: number; from?: string; to?: string } = {}) {
    hr(`State history — ${service}${opts.from ? ` (${opts.from} → ${opts.to ?? 'now'})` : ''}`);

    const cmd = table
        .build(QueryCommand)
        .query({ partition: `BREAKER#${service}`, range: { gte: 'STATE#', lt: 'STATE#~' } })
        .entities(BreakerHistoryEntity)
        .options({ reverse: true, limit: opts.limit ?? 20 });

    const { Items = [] } = await cmd.send();

    if (Items.length === 0) {
        console.log('  (no history)');
        return;
    }

    const filtered = Items.filter((item) => {
        if (opts.from && item.updatedAt < opts.from) return false;
        if (opts.to && item.updatedAt > opts.to) return false;
        return true;
    });

    filtered.forEach((item) => {
        console.log(`  ${item.updatedAt}  ${item.state.padEnd(9)}  mode=${item.mode}  reason=${item.reason}`);
    });
    console.log(`\n  ${filtered.length} record(s)`);
}

/**
 * Alarm events, newest-first. Optionally filter to a specific alarm name.
 *
 * @example queryAlarmEvents('GLOBAL', { limit: 20 })
 * @example queryAlarmEvents('GLOBAL', { alarmName: 'os-search-rejections' })
 */
async function queryAlarmEvents(service = 'GLOBAL', opts: { limit?: number; alarmName?: string } = {}) {
    hr(`Alarm events — ${service}${opts.alarmName ? ` [${opts.alarmName}]` : ''}`);

    const { Items = [] } = await table
        .build(QueryCommand)
        .query({ partition: `BREAKER#${service}`, range: { gte: 'EVENT#', lt: 'EVENT#~' } })
        .entities(AlarmEventEntity)
        .options({ reverse: true, limit: opts.limit ?? 30 })
        .send();

    const { alarmName: filterAlarm } = opts;
    const filtered = filterAlarm ? Items.filter((i) => i.alarmName?.includes(filterAlarm)) : Items;

    if (filtered.length === 0) {
        console.log('  (no events)');
        return;
    }

    filtered.forEach((item) => {
        console.log(`  ${item.stateChangeTime}  ${item.previousState} → ${item.currentState}  alarm=${item.alarmName}`);
    });
    console.log(`\n  ${filtered.length} event(s)`);
}

/**
 * Scan the whole table for any breaker partition in OPEN or HALF_OPEN state.
 */
async function findOpenBreakers() {
    hr('All OPEN / HALF_OPEN breakers (table scan)');

    const { Items = [] } = await table
        .build(ScanCommand)
        .entities(BreakerStateEntity)
        // When .entities() is chained, filters are keyed by entity name
        .options({ filters: { BreakerState: { attr: 'state', in: ['OPEN', 'HALF_OPEN'] } } })
        .send();

    if (Items.length === 0) {
        console.log('  All breakers CLOSED ✓');
        return;
    }

    Items.forEach((item) => {
        console.log(
            `  service=${item.service}  state=${item.state}  mode=${item.mode}` +
                (item.holdUntil ? `  holdUntil=${item.holdUntil}` : '') +
                `  reason=${item.reason}`,
        );
    });
}

/**
 * Summarise trip frequency: total trips and mean time between trips.
 */
async function tripSummary(service = 'GLOBAL') {
    hr(`Trip summary — ${service}`);

    const { Items = [] } = await table
        .build(QueryCommand)
        .query({ partition: `BREAKER#${service}`, range: { gte: 'STATE#', lt: 'STATE#~' } })
        .entities(BreakerHistoryEntity)
        .options({ reverse: false })
        .send();

    const trips = Items.filter((i) => i.state === 'OPEN');
    const closes = Items.filter((i) => i.state === 'CLOSED');

    console.log(`  Total history records : ${Items.length}`);
    console.log(`  OPEN transitions      : ${trips.length}`);
    console.log(`  CLOSED transitions    : ${closes.length}`);

    if (trips.length >= 2) {
        const first = new Date(trips[0].updatedAt).getTime();
        const last = new Date(trips[trips.length - 1].updatedAt).getTime();
        const meanMtbf = (last - first) / (trips.length - 1) / 1000 / 60;
        console.log(`  Mean time between trips: ${meanMtbf.toFixed(1)} min`);
    }

    if (trips.length > 0) {
        const t = trips[trips.length - 1];
        console.log(`\n  Last trip:`);
        console.log(`    at       : ${t.updatedAt}`);
        console.log(`    reason   : ${t.reason}`);
        console.log(`    tripCount: ${t.tripCount}`);
    }
}

// ---------------------------------------------------------------------------
// Run all demos
// ---------------------------------------------------------------------------

(async () => {
    console.log(`\nCircuitControl analysis — table: ${tableName}\n`);

    await getCurrentState();
    await getSignalState();
    await queryHistory('GLOBAL', { limit: 10 });
    await queryAlarmEvents('GLOBAL', { limit: 10 });
    await findOpenBreakers();
    await tripSummary();

    // -----------------------------------------------------------------------
    // Uncomment for targeted queries:
    // -----------------------------------------------------------------------

    // Time-range history slice:
    // await queryHistory('GLOBAL', { from: '2026-05-01T00:00:00Z', to: '2026-05-02T00:00:00Z' });

    // Events for a specific alarm only:
    // await queryAlarmEvents('GLOBAL', { alarmName: 'os-search-rejections', limit: 50 });

    // Single GetItem by known SK:
    // const { Item } = await BreakerStateEntity.build(GetItemCommand)
    //     .key({ PK: 'BREAKER#GLOBAL', SK: 'STATE#CURRENT' })
    //     .send();
    // console.log(Item);
})().catch(console.error);
