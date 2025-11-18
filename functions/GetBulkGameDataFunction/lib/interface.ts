import { LocalizedField } from 'os-client';
import { Sys } from 'os-client/lib/sharedInterfaces/common';
import { GameType } from 'os-client/lib/sharedInterfaces/interfaces';

export interface ISectionGameIds {
    games?: LocalizedField<Sys[]>;
}

export interface FreshGameResponse {
    title: string | null;
    gameSkin: string;
    name: string;
    gameType: GameType;
    id: string;
    contentType: string;
    entryTitle: string;
    vendor: string;
    platform: string[];
}
