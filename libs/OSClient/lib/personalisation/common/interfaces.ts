export interface IRecommendations {
    recommendations: IRecommendation[];
}

export interface IBCYPRecommendations {
    contentful_game_id: string;
    contentful_game_title: string;
    distance: number;
    source_game_skin_name: string;
}

export interface IContentBased {
    _index?: string;
    because_you_played: IBecauseYouPlayed;
    recommendations: IBCYPRecommendations[];
}

export interface IContentBasedRP {
    id: string;
    recently_played_games: IRecentlyPlayed[];
}

export interface IRecentlyPlayed {
    contentful_game_id: string;
    game_skin: string;
    wager?: number;
    margin?: number;
    margin_rank?: number;
    rounds?: number;
    rtp?: number;
}

interface IBecauseYouPlayed {
    contentful_game_id: string;
    contentful_game_title: string;
    source_game_skin_name: string;
}

type GameVendor = 'infinity' | 'roxor-rgp';

export type OrderCriteriaContentful = 'none' | 'margin' | 'rtp' | 'wagered_amount' | 'rounds_played';
export type OrderCriteria = 'margin_rank' | 'rtp' | 'wager' | 'rounds';

type IGameVendor = {
    [key in GameVendor]?: IGameVendorData;
};

export interface IGameVendorData {
    contentful_game_id: string;
    contentful_game_title: string;
}

interface IRecommendation {
    score: number;
    vendor: {
        [key: string]: IGameDetails;
    };
    operator_game_name: string;
}

interface IGameDetails {
    contentful_game_id: string;
    contentful_game_title: string;
    source_game_skin_name: string;
    contentful_game_entry_title: string;
}

export interface SiteGameIDs {
    [key: string]: string[];
}
