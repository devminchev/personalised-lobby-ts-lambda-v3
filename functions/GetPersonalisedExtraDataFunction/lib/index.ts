import {
    IClient,
    logMessage,
    logError,
    ErrorCode,
    getHitsWithIndex,
    ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS,
    LogCode,
} from 'os-client';

// Update ExtraData type to avoid 'any'
interface ExtraData {
    because_you_played?: {
        contentful_game_id?: string;
        contentful_game_title?: string;
        source_game_skin_name?: string;
    };
    _index?: string;
}

interface IBecauseYouPlayedData {
    [indexName: string]: string;
}

interface IPersonalisedExtraData {
    sectionNames?: IBecauseYouPlayedData;
}

export const getPersData = async (
    client: IClient,
    memberId: string,
    siteName: string,
    platform: string,
): Promise<IPersonalisedExtraData> => {
    try {
        const mlResults = await getDataFromMl(client, siteName, memberId, platform);
        return Object.keys(mlResults).length > 0 ? { sectionNames: mlResults } : {};
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { siteName, platform, memberId, err });
        return {};
    }
};

export interface IMLIndexResponse {
    [indexName: string]: string;
}
// TODO: this needs to be reworked when there is a shared alias between the ML indexes and more user-specific data we need to pull from them
export const getDataFromMl = async (
    client: IClient,
    siteName: string,
    memberId: string,
    platform: string,
): Promise<IMLIndexResponse> => {
    const idKey = `${memberId}_${siteName}`;
    const mlQuery = {
        _source: [
            'venture_name',
            'account_id',
            'because_you_played.source_game_skin_name',
            'because_you_played.contentful_game_id',
            'because_you_played.contentful_game_title',
        ],
        query: {
            constant_score: {
                filter: {
                    term: {
                        _id: idKey,
                    },
                },
            },
        },
        size: 3,
    };

    const hitsWithIndex = await getHitsWithIndex<ExtraData>(client, mlQuery, ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS);

    if (hitsWithIndex.length === 0) {
        logMessage('warn', LogCode.NoMlRecordGamesFound, { siteName, memberId, platform });
        return {};
    }

    // Build the mapping: indexName -> recGameTitle
    const result = hitsWithIndex.reduce<IMLIndexResponse>((acc, curr) => {
        const seedGame = curr.source.because_you_played || {};
        const match = curr.index.match(/because-you-played-[a-z]/i);
        if (!match) {
            // Skip this record if indexName does not match expected pattern
            return acc;
        }
        const indexName = match[0];
        const title = seedGame.contentful_game_title || '';
        acc[indexName] = gameTitleGuard(title) ? '' : title;
        return acc;
    }, {});

    return result;
};

// Restore the gameTitleGuard function
const gameTitleGuard = (gameTitle: string): boolean => {
    const GAME_TITLE_GUARD_PATTERN = /\bTBC\b.*\bnot\b.*(\bavailable\b.*)?\bregion\b/i;
    return GAME_TITLE_GUARD_PATTERN.test(gameTitle);
};
