import { RequestDetails } from './utils';
import { ErrorCode, errorMessages } from './errors';

export enum LogCode {
    HandleNonPersonalised = 'HANDLE_NON_PERSONALIZED',
    HandlePersonalised = 'HANDLE_PERSONALIZED',
    NoMLRecord = 'NO_ML_REC',
    NoMlRecordGamesFound = 'NO_ML_REC_GAMES_FOUND',
    NoMLRecordDefaulting = 'NO_ML_REC_DEFAULTING',
    NoMLRecordGamesOnExit = 'NO_ML_REC_GAMES_ON_EXIT',
    MutlipleVendors = 'MULTIPLE_VENDORS',
    GameNotFound = 'GAME_NOT_FOUND',
    EmptyNavigation = 'EMPTY_NAV',
    MissingNavigation = 'MISSING_NAVIGATION',
    MissingTheme = 'MISSING_THEME',
    info = 'INFO',
    GameWebhookSuccess = '200',
    NoGameShuffleData = 'NO_GAME_SHUFFLE_DATA',
    RpGamesLimitNotMet = 'RP_GAMES_LIMIT_NOT_MET',
    VariantUsed = 'AB_TEST_VARIANT',
    VariantDefaulting = 'AB_TEST_VARIANT_DEFAULT',
    BreakerInitFailed = 'BREAKER_INIT_FAILED',
    BreakerInitSuccess = 'BREAKER_INIT_OK',
    BreakerTripped = 'BREAKER_TRIPPED',
    BreakerProbeSuccess = 'BREAKER_PROBE_OK',
    BreakerProbeFailure = 'BREAKER_PROBE_FAIL',
    BreakerBlocked = 'BREAKER_BLOCKED',
    ControllerAlarmReceived = 'CTRL_ALARM_RECEIVED',
    ControllerAlarmStale = 'CTRL_ALARM_STALE',
    ControllerAlarmTransition = 'CTRL_ALARM_TRANSITION',
    ControllerTickNoOp = 'CTRL_TICK_NOOP',
    ControllerTickTransition = 'CTRL_TICK_TRANSITION',
    ControllerManualOverride = 'CTRL_MANUAL_OVERRIDE',
    ControllerOptimisticRetry = 'CTRL_OPTIMISTIC_RETRY',
}

const logMessages: Record<LogCode, string> = {
    [LogCode.HandleNonPersonalised]: 'HANDLING NON PERSONALIZED SECTION',
    [LogCode.HandlePersonalised]: 'HANDLING PERSONALIZED SECTION',
    [LogCode.NoMLRecord]: 'HANDLING MISSING ML RECOMMENDATIONS FOR PERSONALIZED SECTION',
    [LogCode.NoMlRecordGamesFound]:
        'RECOMMENDATIONS FOR PERSONALIZED SECTION WERE FOUND BUT GAMES WERE NOT RETURNED FROM GAMES INDEX',
    [LogCode.NoMLRecordDefaulting]:
        'HANDLING MISSING ML RECOMENDEDATIONS FOR PERSONALIZED SECTION, USING FALLBACK RECOMMENDED SITEGAME IDS',
    [LogCode.NoMLRecordGamesOnExit]: 'NO ML RECOMMENDATIONS GAMES ON EXIT FOUND',
    [LogCode.MutlipleVendors]: "MULTIPLE VENDORS FOUND FOR GAME. USING 'Infinity' PROVIDER IF FOUND OR 1ST RECORD",
    [LogCode.GameNotFound]: 'NO GAME RECORD FOUND IN CONTETFUL',
    [LogCode.EmptyNavigation]: 'NO LINKS WERE FOUND FOR THE NAVIGATION ITEM',
    [LogCode.MissingNavigation]: 'NO NAVIGATION RECORD WAS FOUND IN OPEN_SEARCH',
    [LogCode.MissingTheme]: 'THEME WAS LINKED BUT THE RECORD CAN NOT BE FOUND',
    [LogCode.info]: 'REQUEST_DEBUG_INFO',
    [LogCode.GameWebhookSuccess]: '200',
    [LogCode.NoGameShuffleData]: 'No records found in game shuffle index',
    [LogCode.RpGamesLimitNotMet]: 'RECENTLY PLAYED GAMES SIZE IS BELOW THE LIMIT OF 3 ',
    [LogCode.VariantUsed]: 'Lambda received header using variant: ',
    [LogCode.VariantDefaulting]: 'No header passed default to unaffected variant',
    [LogCode.BreakerInitFailed]: 'Circuit breaker failed to initialise from DynamoDB — failing open',
    [LogCode.BreakerInitSuccess]: 'Circuit breaker initialised',
    [LogCode.BreakerTripped]: 'Local circuit breaker tripped OPEN',
    [LogCode.BreakerProbeSuccess]: 'Local circuit breaker closed — probe succeeded',
    [LogCode.BreakerProbeFailure]: 'Local circuit breaker re-opened — probe failed',
    [LogCode.BreakerBlocked]: 'Circuit breaker blocked call',
    [LogCode.ControllerAlarmReceived]: 'CloudWatch alarm event received',
    [LogCode.ControllerAlarmStale]: 'CloudWatch alarm event ignored — stale',
    [LogCode.ControllerAlarmTransition]: 'Breaker state transition from alarm event',
    [LogCode.ControllerTickNoOp]: 'Scheduled tick — no transition required',
    [LogCode.ControllerTickTransition]: 'Scheduled tick — state transition applied',
    [LogCode.ControllerManualOverride]: 'Breaker state set manually',
    [LogCode.ControllerOptimisticRetry]: 'Optimistic-concurrency conflict — retrying',
};

export const getLogMessage = (code: LogCode | ErrorCode): string => {
    if (code in logMessages) {
        return logMessages[code as LogCode];
    }
    // otherwise treat it as an ErrorCode
    return errorMessages[code as ErrorCode] ?? 'Unknown code';
};

type LogType = 'log' | 'warn';

/**
 * Logs message with the specified details.
 * @param {requestDetails} [requestDetails] - Request Details passed into the call.
 * @param {string} [message] - The log message.
 */
export const logMessage = (
    logType: LogType,
    code: LogCode | ErrorCode,
    requestDetails?: RequestDetails,
    message?: string,
) => {
    if (logType === 'warn') {
        console.warn({
            warnCode: code,
            warnLog: message || getLogMessage(code),
            ...requestDetails,
        });
    } else {
        console.log({
            infoCode: code,
            infoLog: message || getLogMessage(code),
            ...requestDetails,
        });
    }
};
