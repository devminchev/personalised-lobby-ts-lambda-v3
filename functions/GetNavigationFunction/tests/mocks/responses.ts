export const VENTURE_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'venture-id-123',
                },
            },
        ],
    },
};

interface NavigationResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                entryTitle: { [key: string]: string };
                venture: { [key: string]: { sys: { type: string; linkType: string; id: string } } };
                links?: { [key: string]: Array<{ sys: { type: string; linkType: string; id: string } }> };
                bottomNavLinks?: { [key: string]: Array<{ sys: { type: string; linkType: string; id: string } }> };
            };
        }>;
    };
}

export const NAVIGATION_SUCCESS_RESP: NavigationResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'cat-id-1',
                    entryTitle: { 'en-GB': 'Category 1' },
                    links: { 'en-GB': [{ sys: { type: 'Link', linkType: 'Entry', id: 'link-id-1' } }] },
                    venture: {
                        'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: 'venture-id-123' } },
                    },
                },
            },
        ],
    },
};

interface LinkResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                entryTitle: { [key: string]: string };
                label: { [key: string]: string };
                view: { [key: string]: { sys: { type: string; linkType: string; id: string } } };
                image: { [key: string]: string };
                externalUrl: { [key: string]: string };
                internalUrl: { [key: string]: string };
                liveHidden: { [key: string]: boolean };
            };
        }>;
    };
}

export const LINK_SUCCESS_RESPONSE: LinkResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'link-id-1',
                    entryTitle: { 'en-GB': 'Test Monopoly' },
                    label: {
                        'en-GB': 'search',
                    },
                    view: {
                        'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: 'view-id-123' } },
                    },
                    image: { 'en-GB': 'http://example.com/bg.png' },
                    externalUrl: { 'en-GB': 'http://example.com' },
                    internalUrl: { 'en-GB': 'http://example.com' },
                    liveHidden: { 'en-GB': false },
                },
            },
        ],
    },
};

interface ViewResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                viewSlug: { [key: string]: string };
            };
        }>;
    };
}

export const VIEW_SUCCESS_RESPONSE: ViewResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'view-id-123',
                    viewSlug: { 'en-GB': 'slots' },
                },
            },
        ],
    },
};

// Invalid responses

export const NOT_FOUND_RESPONSE: LinkResponse = {
    hits: {
        hits: [],
    },
};

export const MISSING_LINK_TYPE_IN_NAV_RESP: NavigationResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'nav-id-1',
                    entryTitle: { 'en-GB': 'Nav 1' },
                    venture: {
                        'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: 'venture-id-123' } },
                    },
                },
            },
        ],
    },
};
