export interface GameShuffle {
    game_skin: string;
    rtp: number;
}

export interface IGameShuffleRecord {
    entryId: string;
    gameId: string;
    name?: string;
    title?: string;
    gameSkin?: string;
    demoUrl?: string;
    realUrl?: string;
    imgUrlPattern?: string;
    representativeColor?: string;
    animationMedia?: string;
    foregroundLogoMedia?: object;
    backgroundMedia?: object;
    headlessJackpot?: object;
}

export interface IGameShuffleResponse {
    tileOne: IGameShuffleRecord[];
    tileTwo: IGameShuffleRecord[];
    tileThree?: IGameShuffleRecord[];
}
