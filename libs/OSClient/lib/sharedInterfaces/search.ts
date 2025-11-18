interface GameInfo {
    sys: {
        linkType: string;
        id: string;
        type: string;
    };
}

export interface IGamesSource {
    games: { [key: string]: GameInfo[] };
}

export interface ISiteGameToLayout {
    invertedIndex: Record<string, string[]>;
    allSiteGameIds: string[];
}
