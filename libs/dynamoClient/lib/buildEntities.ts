import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Table, Entity, item, string, number, map, record, any } from 'dynamodb-toolbox';

interface CachedEntities {
    cacheKey: string;
    table: ReturnType<typeof buildTable>;
    BreakerStateEntity: ReturnType<typeof buildBreakerStateEntity>;
    SignalStateEntity: ReturnType<typeof buildSignalStateEntity>;
    BreakerHistoryEntity: ReturnType<typeof buildBreakerHistoryEntity>;
    AlarmEventEntity: ReturnType<typeof buildAlarmEventEntity>;
}

let cached: CachedEntities | null = null;

function buildTable(documentClient: DynamoDBDocumentClient, tableName: string) {
    return new Table({
        documentClient,
        name: tableName,
        partitionKey: { name: 'PK', type: 'string' },
        sortKey: { name: 'SK', type: 'string' },
    });
}

function buildBreakerStateEntity(table: ReturnType<typeof buildTable>) {
    return new Entity({
        name: 'BreakerState',
        table,
        entityAttribute: false,
        timestamps: false,
        schema: item({
            PK: string().key(),
            SK: string().key(),
            entityType: string(),
            service: string(),
            state: string(),
            mode: string(),
            updatedAt: string(),
            updatedBy: string(),
            reason: string(),
            holdUntil: string().optional(),
            version: number(),
            tripCount: number(),
            healthyProbeCount: number(),
            openedByAlarm: map({
                alarmName: string(),
                fromState: string(),
                toState: string(),
            }).optional(),
        }),
    });
}

function buildSignalStateEntity(table: ReturnType<typeof buildTable>) {
    return new Entity({
        name: 'SignalState',
        table,
        entityAttribute: false,
        timestamps: false,
        schema: item({
            PK: string().key(),
            SK: string().key(),
            entityType: string(),
            service: string(),
            signals: record(string(), map({ updatedAt: string() })),
            updatedAt: string(),
        }),
    });
}

function buildBreakerHistoryEntity(table: ReturnType<typeof buildTable>) {
    return new Entity({
        name: 'BreakerHistory',
        table,
        entityAttribute: false,
        timestamps: false,
        schema: item({
            PK: string().key(),
            SK: string().key(),
            entityType: string(),
            service: string(),
            state: string(),
            mode: string(),
            updatedAt: string(),
            updatedBy: string(),
            reason: string(),
            holdUntil: string().optional(),
            version: number(),
            tripCount: number(),
            healthyProbeCount: number(),
            openedByAlarm: map({
                alarmName: string(),
                fromState: string(),
                toState: string(),
            }).optional(),
            ttl: number().optional(),
        }),
    });
}

function buildAlarmEventEntity(table: ReturnType<typeof buildTable>) {
    return new Entity({
        name: 'AlarmEvent',
        table,
        entityAttribute: false,
        timestamps: false,
        schema: item({
            PK: string().key(),
            SK: string().key(),
            entityType: string(),
            service: string(),
            alarmName: string(),
            previousState: string(),
            currentState: string(),
            stateChangeTime: string(),
            reason: string().optional(),
            rawEvent: any().optional(),
            ttl: number().optional(),
        }),
    });
}

/**
 * Returns a cached set of DynamoDB Toolbox entities for the CircuitControl table.
 * Entities are rebuilt only when the table name changes.
 */
export function getEntities(documentClient: DynamoDBDocumentClient, tableName: string) {
    if (cached?.cacheKey === tableName) return cached;

    const table = buildTable(documentClient, tableName);
    cached = {
        cacheKey: tableName,
        table,
        BreakerStateEntity: buildBreakerStateEntity(table),
        SignalStateEntity: buildSignalStateEntity(table),
        BreakerHistoryEntity: buildBreakerHistoryEntity(table),
        AlarmEventEntity: buildAlarmEventEntity(table),
    };
    return cached;
}
