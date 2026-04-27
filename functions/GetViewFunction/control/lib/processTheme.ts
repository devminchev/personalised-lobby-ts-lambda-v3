import {
    IClient,
    ErrorCode,
    logError,
    getHits,
    IIGTheme,
    IIGThemeOS,
    THEME_INDEX_READ_ALIAS,
    logMessage,
} from 'os-client';

const extractThemeData = async (
    client: IClient,
    osQuery: object,
    spaceLocale: string,
    viewId: string,
    siteName: string,
    platform: string,
): Promise<IIGTheme> => {
    const hits: IIGThemeOS[] = await getHits(client, osQuery, THEME_INDEX_READ_ALIAS);

    if (hits.length === 0) {
        logMessage(
            'warn',
            ErrorCode.MissingTheme,
            { siteName, platform, viewId, hits },
            `Record was not found for viewId: ${viewId}`,
        );
        return { primaryColor: '' };
    }

    const theme = hits[0];

    return {
        primaryColor: theme.primaryColor?.[spaceLocale] || '',
        ...(theme.secondaryColor?.[spaceLocale] && {
            secondaryColor: theme.secondaryColor[spaceLocale],
        }),
        ...(theme.image?.[spaceLocale] && {
            image: theme.image[spaceLocale],
        }),
    };
};

export const getTheme = async (
    client: IClient,
    themeId: string,
    spaceLocale: string,
    viewId: string,
    siteName: string,
    platform: string,
): Promise<IIGTheme> => {
    const themeQuery = {
        query: {
            match: {
                _id: themeId,
            },
        },
        size: 1,
    };

    return extractThemeData(client, themeQuery, spaceLocale, viewId, siteName, platform);
};
