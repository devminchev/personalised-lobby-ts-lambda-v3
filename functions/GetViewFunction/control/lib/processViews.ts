import {
    IClient,
    ErrorCode,
    createError,
    getHits,
    VIEW_INDEX_READ_ALIAS,
    IView,
    tryGetValueFromLocalised,
    logMessage,
} from 'os-client';

interface ViewLayout {
    entryId: string;
    topContent: string[];
    primaryContent: string[];
    name: string;
    slug: string;
    liveHidden: boolean;
    classification: string;
    themeId?: string;
}

export interface GetViewParams {
    client: IClient;
    viewSlug: string;
    ventureId: string;
    platform: string;
    spaceLocale: string;
    userLocale: string;
    sessionVisibility: string;
    envVisibility: string;
    siteName: string;
}

type BuildViewQueryParams = Omit<GetViewParams, 'client' | 'userLocale'>;

const buildViewQuery = ({
    viewSlug,
    ventureId,
    platform,
    spaceLocale,
    sessionVisibility,
    envVisibility,
}: BuildViewQueryParams) => {
    const viewKeywordField = `viewSlug.${spaceLocale}.keyword`;
    const ventureField = `venture.${spaceLocale}.sys.id`;
    const platformField = `platformVisibility.${spaceLocale}.keyword`;
    const environmentField = `environmentVisibility.${spaceLocale}.keyword`;
    const sessionField = `sessionVisibility.${spaceLocale}.keyword`;

    return {
        _source: ['name', 'viewSlug', 'classification', 'topContent', 'primaryContent', 'liveHidden', 'theme', 'id'],
        query: {
            bool: {
                must: [{ match_phrase: { [ventureField]: ventureId } }],
                filter: [
                    { term: { [viewKeywordField]: viewSlug } },
                    { term: { [platformField]: platform } },
                    { term: { [environmentField]: envVisibility } },
                    { term: { [sessionField]: sessionVisibility } },
                ],
            },
        },
        size: 1,
        terminate_after: 1,
    };
};

const extractViewData = async (
    client: IClient,
    viewSlug: string,
    osQuery: object,
    spaceLocale: string,
    userLocale: string,
    siteName: string,
    platform: string,
): Promise<ViewLayout> => {
    const hits: IView[] = await getHits(client, osQuery, VIEW_INDEX_READ_ALIAS);

    if (hits.length === 0) {
        logMessage('warn', ErrorCode.InvalidView, { siteName, platform, viewSlug, hits });
        throw createError(ErrorCode.InvalidView, 404);
    }

    const entry = hits[0];
    const topArr = entry.topContent?.[spaceLocale] || [];
    const primArr = entry.primaryContent?.[spaceLocale];

    if (![topArr, primArr].every(Array.isArray)) {
        throw createError(ErrorCode.UnprocessableEntity, 422);
    }

    const topContent = topArr.map((item) => item.sys.id);
    const primaryContent = primArr.map((item) => item.sys.id);
    const viewName = tryGetValueFromLocalised(userLocale, spaceLocale, entry?.name, '');
    const linkedThemeId = entry?.theme?.[spaceLocale]?.sys?.id;

    return {
        topContent,
        primaryContent,
        name: viewName,
        slug: entry?.viewSlug?.[spaceLocale] ?? '',
        liveHidden: entry?.liveHidden?.[spaceLocale] ?? false,
        classification: entry.classification?.[spaceLocale] ?? '',
        entryId: entry.id,
        themeId: linkedThemeId,
    };
};

export const getView = async ({
    client,
    viewSlug,
    ventureId,
    platform,
    spaceLocale,
    userLocale,
    sessionVisibility,
    envVisibility,
    siteName,
}: GetViewParams): Promise<ViewLayout> => {
    const getViewQuery = buildViewQuery({
        viewSlug,
        ventureId,
        platform,
        spaceLocale,
        sessionVisibility,
        envVisibility,
        siteName,
    });

    return extractViewData(client, viewSlug, getViewQuery, spaceLocale, userLocale, siteName, platform);
};
