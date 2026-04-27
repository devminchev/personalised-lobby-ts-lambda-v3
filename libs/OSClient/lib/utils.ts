import { DEFAULT_ENVIRONMENT, VALID_ENVIRONMENTS } from './constants';
import { logError, createError, ErrorCode } from './errors';
import { IOpenSearchQuery, LocalizedField } from './sharedInterfaces/common';
import { IBynderAsset, SanitizedBynder } from './sharedInterfaces/interfaces';

export const GAME_SEARCH_QUERY_LIMIT = 5000;

/**
 * Resolves a game property that may be either flat (new index format)
 * or nested under a locale key (old index format).
 *
 * Tries the flat value first; falls back to value[spaceLocale] for
 * backward compatibility during the index migration.
 *
 * - Primitives (string, boolean, number) → returned as-is (new format).
 * - Arrays → returned as-is (new format, e.g. tags, platformVisibility).
 * - Objects → if the object contains a `spaceLocale` key it is treated
 *   as the old `LocalizedField<T>` wrapper and `value[spaceLocale]` is
 *   returned; otherwise the object itself is the flat value (new format,
 *   e.g. gamePlatformConfig, webComponentData).
 */
// This will be needed if we ever go back to having localisation for the non-localised properties on the game.
// This function will be needed if we ever go back to having localisation for the non-localised properties on the game.
// MR carrying fallback cleanup changes - GTECH-1320067-remove-fallback
export function resolveGameProp<T>(
    value: T | LocalizedField<T> | null | undefined,
    spaceLocale: string,
    defaultValue: T,
): T {
    if (value == null) return defaultValue;

    // Primitives are always flat (new format)
    if (typeof value !== 'object') return value as T;

    // Arrays are always flat (new format)
    if (Array.isArray(value)) return value as T;

    // Object: if it contains the spaceLocale key, it's the old localized format
    const obj = value as Record<string, unknown>;
    if (spaceLocale in obj) {
        return (obj[spaceLocale] as T) ?? defaultValue;
    }

    // Otherwise it's a flat object (new format: gamePlatformConfig, webComponentData, etc.)
    return value as T;
}

/* This has to go away after RRC venture name is updated correctly in Contentful*/
type VentureNameKey = 'rainbowrichescasino';
type VentureNameValue = 'rainbowriches';

const VENTURE_NAME_MAP: Record<VentureNameKey, VentureNameValue> = {
    rainbowrichescasino: 'rainbowriches',
};

export const patchVentureName = (siteName: string): string => {
    return VENTURE_NAME_MAP[siteName as VentureNameKey] || siteName;
};
/* ----------------------------------------------------------------------------- */
export const validators = {
    siteName: (v: string): boolean => typeof v === 'string' && /^(?!all$)[a-z]+$/.test(v),
    allSiteName: (v: string): boolean => v === 'all',
    platform: (v: string): boolean => typeof v === 'string' && ['ios', 'android', 'web'].includes(v.toLowerCase()),
    viewSlug: (v: string): boolean => typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v),
    slug: (v: string): boolean => typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v),
    sectionId: (v: string): v is string => typeof v === 'string' && /^[A-Za-z0-9]+$/.test(v),
    nameOrSkin: (v: string): v is string => typeof v === 'string' && /^[^./]{1,100}$/u.test(v), // max 100 characters, no . or / allowed
    // queryparams
    memberId: (v: string): v is string => typeof v === 'string' && /^[0-9]+$/.test(v),
    auth: (v: string): v is string => typeof v === 'string' && /^(?:true|false)$/i.test(v),
};

type ValidatorFn = (value: unknown) => boolean;

export const checkRequestParams = (...params: (unknown | [unknown, ValidatorFn])[]) => {
    const missing: unknown[] = [];
    const invalid: unknown[] = [];

    params.forEach((param) => {
        const [value, validate] = Array.isArray(param) ? param : [param, undefined];
        if (value == null || (typeof value === 'string' && value.trim() === '')) {
            missing.push(value);
        } else if (validate && !validate(value)) {
            invalid.push(value);
        }
    });

    if (missing.length || invalid.length) {
        logError(ErrorCode.MissingParams, 400, { params: { ...missing, ...invalid } });
        throw createError(ErrorCode.MissingParams, 400);
    }
};

/**
 * Pick siteGame value if it's meaningful:
 * 1. If `siteGame` is defined and (if it’s a string/array/number/boolean) non-empty, return it.
 * 2. Else if `game` is defined and (if it’s a string/array/number/boolean) non-empty, return it.
 * 3. Otherwise return `defaultsTo`.
 */
export function pickGameOrSiteGameValue<T>(siteGame: T | undefined, game: T | undefined, defaultsTo: T): T {
    const hasValue = (val: T | undefined): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || Array.isArray(val)) {
            return (val as string | unknown[]).length > 0;
        }
        return true;
    };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (hasValue(siteGame)) return siteGame!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (hasValue(game)) return game!;
    return defaultsTo;
}

/**
 * Resolves a game-level property with a fallback to its gamePlatformConfig
 * equivalent.  Used for properties (gameName, gameSkin, mobileGameName,
 * mobileGameSkin, mobileOverride, rtp) that may exist both on the game
 * object and inside the resolved gamePlatformConfig.
 *
 * Tries the game value first; falls back to the config value; returns
 * defaultValue if neither is truthy.
 */
export function pickGameOrConfigValue<T>(
    gameValue: T | null | undefined,
    configValue: T | null | undefined,
    defaultValue: T,
): T {
    if (gameValue) return gameValue;
    if (configValue) return configValue;
    return defaultValue;
}

export const createGamesQuery = (siteGameIds: string[], spaceLocale: string, platform: string): IOpenSearchQuery => {
    const environmentField = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const platformField = `siteGame.platformVisibility.${spaceLocale}.keyword`;

    return {
        _source: [
            'siteGame.sash',
            'siteGame.id',
            'siteGame.environmentVisibility',
            'siteGame.platformVisibility',
            'siteGame.liveHidden',
            'siteGame.tags',
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: { match_all: {} },
                                    inner_hits: {
                                        _source: [
                                            'game.id',
                                            'game.title',
                                            'game.dfgWeeklyImgUrlPattern',
                                            'game.infoImgUrlPattern',
                                            'game.imgUrlPattern',
                                            'game.loggedOutImgUrlPattern',
                                            'game.bynderDFGWeeklyImage',
                                            'game.animationMedia',
                                            'game.loggedOutAnimationMedia',
                                            'game.foregroundLogoMedia',
                                            'game.loggedOutForegroundLogoMedia',
                                            'game.backgroundMedia',
                                            'game.loggedOutBackgroundMedia',
                                            'game.progressiveJackpot',
                                            'game.progressiveBackgroundColor',
                                            'game.representativeColor',
                                            'game.videoUrlPattern',
                                            'game.tags',
                                            'game.webComponentData',
                                            'game.gameName',
                                            'game.gameSkin',
                                            'game.mobileGameName',
                                            'game.mobileGameSkin',
                                            'game.mobileOverride',
                                            `game.gamePlatformConfig.demoUrl`,
                                            `game.gamePlatformConfig.realUrl`,
                                            `game.gamePlatformConfig.mobileDemoUrl`,
                                            `game.gamePlatformConfig.mobileRealUrl`,
                                        ],
                                    },
                                },
                            },
                            {
                                terms: {
                                    _id: siteGameIds,
                                },
                            },
                            {
                                term: {
                                    [environmentField]: getLambdaExecutionEnvironment(),
                                },
                            },
                            {
                                term: {
                                    [platformField]: platform,
                                },
                            },
                        ],
                    },
                },
            },
        },
        size: 1000,
    };
};

export const createGamesSearchQuery = (
    allSiteGameIds: string[],
    ventureId: string,
    spaceLocale: string,
): IOpenSearchQuery => {
    const key = `siteGame.venture.${spaceLocale}.sys.id`;
    const matchExpression: any = {
        match: {},
    };
    matchExpression.match[key] = ventureId;
    const environment = `siteGame.environmentVisibility.${spaceLocale}`;

    const sectionGamesListQuery = {
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                ...matchExpression,
                            },
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: {
                                        match_all: {},
                                    },
                                    inner_hits: {
                                        _source: [
                                            'game.gamePlatformConfig',
                                            'game.title',
                                            'game.infoImgUrlPattern',
                                            'game.loggedOutImgUrlPattern',
                                            'game.imgUrlPattern',
                                        ],
                                    },
                                },
                            },
                            {
                                terms: {
                                    _id: allSiteGameIds,
                                },
                            },
                            {
                                term: {
                                    [environment]: getLambdaExecutionEnvironment(),
                                },
                            },
                        ],
                    },
                },
            },
        },
        _source: ['siteGame.id'],
        size: GAME_SEARCH_QUERY_LIMIT,
    };

    return sectionGamesListQuery;
};

export type RequestDetails = {
    siteName?: string;
    platform?: string;
    userLocale?: string;
    gameName?: string;
    memberId?: string;
    viewSlug?: string;
    sectionId?: string;
    sectionType?: string;
    sectionSlug?: string;
    viewId?: string;
    gameId?: string;
    isLoggedIn?: boolean;
    showOnlyLoggedIn?: boolean;
    auth?: boolean;
    [key: string]: any;
};

interface IGameInfoQueryKeys {
    ventureMatchExpression: object;
    nameTerm: object;
    mobileNameTerm: object;
}

export const createQueryKeysForInfoAndConfig = (
    ventureId: string,
    gameName: string,
    spaceLocale: string,
): IGameInfoQueryKeys => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const ventureMatchExpression: Record<string, Record<string, string>> = {
        match: {},
    };
    ventureMatchExpression.match[ventureKey] = ventureId;
    const nameKey = `game.gameName`;
    const mobileNameKey = `game.mobileGameName`;
    const nameTerm: Record<string, Record<string, string>> = {
        term: {},
    };
    nameTerm.term[nameKey] = gameName;
    const mobileNameTerm: Record<string, Record<string, string>> = {
        term: {},
    };
    mobileNameTerm.term[mobileNameKey] = gameName;

    return { ventureMatchExpression, nameTerm, mobileNameTerm };
};

export interface TermFilter {
    term: LocalizedField<string>;
}

export interface IPayload {
    entryId: string;
}
export interface IPayloadByGameId {
    gameId: string;
}

interface IPayloadWithPriority extends IPayload {
    priorityOverride?: number;
}

export const orderedPayload = <T extends IPayload>(payload: T[], initialIdsArray: string[]): T[] => {
    return payload.sort((a, b) => {
        return initialIdsArray.indexOf(a.entryId) - initialIdsArray.indexOf(b.entryId);
    });
};

export interface IPayloadByGameId {
    gameId: string;
}
// TODO: refactor usages of this to use orderByKey
export const orderedPayloadByGameId = <T extends IPayloadByGameId>(payload: T[], initialIdsArray: string[]): T[] => {
    return payload.sort((a, b) => {
        return initialIdsArray.indexOf(a.gameId) - initialIdsArray.indexOf(b.gameId);
    });
};

export interface IPayloadByGameSkin {
    gameSkin?: string;
}

// Minimal generic: order by external reference list; unknowns go to the end
export function orderByKey<T>(items: T[], ordering: string[], getKey: (item: T) => string): T[] {
    const rank = new Map<string, number>();
    for (let i = 0; i < ordering.length; i += 1) rank.set(ordering[i], i);

    return items.slice().sort((a, b) => {
        const aRank = rank.get(getKey(a));
        const bRank = rank.get(getKey(b));
        const ar = aRank === undefined ? Number.POSITIVE_INFINITY : aRank;
        const br = bRank === undefined ? Number.POSITIVE_INFINITY : bRank;
        return ar - br;
    });
}

export const orderedPayloadByPriority = <T extends IPayloadWithPriority>(payload: T[]): T[] => {
    return payload.sort((a, b) => {
        return b.priorityOverride! - a.priorityOverride!;
    });
};

export const extractPlatformFromTitle = (title: string): string => {
    const lowercasedTitle = title.toLowerCase();
    switch (true) {
        case lowercasedTitle.includes('[desktop]'):
            return 'desktop';
        case lowercasedTitle.includes('[tablet]'):
            return 'tablet';
        case lowercasedTitle.includes('[phone]'):
        case lowercasedTitle.includes('[mobile]'):
            return 'phone';
        default:
            return 'desktop';
    }
};

export const getLambdaExecutionEnvironment = () => {
    let executionEnvironment = process.env.EXECUTION_ENVIRONMENT?.trim();

    if (!executionEnvironment) {
        console.error(
            `EXECUTION_ENVIRONMENT environment variable is not defined: '${executionEnvironment}'. Defaulting to 'production'.`,
        );
        executionEnvironment = DEFAULT_ENVIRONMENT;
    }

    if (!VALID_ENVIRONMENTS.includes(executionEnvironment)) {
        console.error(
            `EXECUTION_ENVIRONMENT is invalid: '${executionEnvironment}'. Valid environments are: '${VALID_ENVIRONMENTS}'. Defaulting to 'production'.`,
        );
        executionEnvironment = DEFAULT_ENVIRONMENT;
    }

    return executionEnvironment;
};

export const replaceEmptyStringsWithNull = (item: string | object | string[]): string | object | string[] | null => {
    if (item === '') return null;
    if (Array.isArray(item)) return item.map(replaceEmptyStringsWithNull);
    if (typeof item === 'object' && item !== null) {
        return Object.fromEntries(
            Object.entries(item).map(([key, value]) => [key, replaceEmptyStringsWithNull(value)]),
        );
    }
    return item;
};

// For prop overrides where the same prop is used in the base and wrapped models (like GameV2 and SiteGameV2 models)
export interface coalescePropValueOptions<T> {
    overrideField?: LocalizedField<T> | T;
    baseField?: LocalizedField<T> | T;
    spaceLocale: string;
    defaultFallback: T;
}

/**
 * Resolve a non user localised prop by picking, in order:
 *  1. overrideField[spaceLocale] if it’s not null/undefined (even if false/0/"")
 *  2. baseField[spaceLocale]     if it’s not null/undefined
 *  3. defaultFallback             otherwise
 *
 * Internally uses JS’s nullish coalescing (`a ?? b ?? c`) so only
 * `null` or `undefined` are treated as “missing” — all other falsy
 * values (false, 0, "", etc.) are preserved as valid overrides.
 *
 * @param overrideField   The wrapped model’s localized field to prefer
 * @param baseField       The base model’s localized field to fall back to
 * @param spaceLocale    Locale key (e.g. 'en-GB') to look up
 * @param defaultFallback Value to return if neither field provides one
 * @returns               The first non‐nullish localized value or defaultFallback
 */
export const coalescePropValue = <T>({
    overrideField,
    baseField,
    spaceLocale,
    defaultFallback,
}: coalescePropValueOptions<T>): T => {
    const resolve = (field: LocalizedField<T> | T | undefined): T | null | undefined => {
        if (field == null) return field;
        if (typeof field !== 'object') return field as T;
        if (Array.isArray(field)) return field as T;
        const obj = field as Record<string, unknown>;
        if (spaceLocale in obj) return obj[spaceLocale] as T;
        return field as T;
    };
    return resolve(overrideField) ?? resolve(baseField) ?? defaultFallback;
};

const bynderAssetProps = (asset: IBynderAsset): SanitizedBynder => ({
    name: asset?.name,
    type: asset?.type,
    width: asset?.width,
    height: asset?.height,
    orientation: asset?.orientation,
    original: asset?.original,
    ...(asset?.tags?.length ? { tags: asset?.tags } : {}),
    thumbnails: {
        transformBaseUrl: asset?.thumbnails?.transformBaseUrl,
        original: asset?.thumbnails?.original,
    },
});

export const extractBynderObject = (bynderObject: IBynderAsset[] | null): SanitizedBynder | null => {
    const bynderObj = bynderObject?.[0];
    return bynderObj ? bynderAssetProps(bynderObj) : null;
};

export const sanitiseBynderAssets = (bynderAssets: IBynderAsset[] | null): SanitizedBynder[] | null => {
    if (!bynderAssets?.length) return null;
    return bynderAssets.map(bynderAssetProps);
};

/**
 * Sorts an array of objects by a specified numeric field in ascending or descending order.
 * Handles both number and string representations of the field.
 * @param arr Array of objects to sort
 * @param field The field name to sort by (must be number or string representing a number)
 * @param direction 'asc' for ascending (lowest first), 'desc' for descending (highest first)
 */
export function sortByRanking<T>(arr: T[], field: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return arr.slice().sort((a, b) => {
        const aVal = typeof a[field] === 'number' ? (a[field] as number) : parseFloat(a[field] as unknown as string);
        const bVal = typeof b[field] === 'number' ? (b[field] as number) : parseFloat(b[field] as unknown as string);
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
}

/**
 * Returns the size of a JSON payload in megabytes.
 * If a string is provided, it is assumed to be already stringified JSON and is measured directly.
 * Otherwise, the value is stringified before measuring.
 */
export const jsonSizeInMb = (data: unknown): number => {
    const asString = typeof data === 'string' ? data : JSON.stringify(data);
    return Buffer.byteLength(asString, 'utf8') / (1024 * 1024);
};
