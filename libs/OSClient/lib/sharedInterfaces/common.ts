import { SysLink } from 'contentful-management';

export interface LocalizedField<T> {
    [key: string]: T;
}

export interface Venture {
    sys: SystemLink;
}

export interface SysReference<T> {
    sys: T;
}

export interface SystemLink {
    type: string;
    linkType: string;
    id: string;
}

export interface VentureIndex {
    id: string;
}
export interface IOpenSearchQuery {
    query: Record<string, any>;
    _source?: string[];
    size?: number;
}

export interface Sys {
    sys: SystemLink;
}

export interface Icon {
    format?: string | null;
    pattern?: string | null;
}

export interface Navigation {
    id: string;
    entryTitle: LocalizedField<string>;
    venture: LocalizedField<Sys>;
    links?: LocalizedField<Array<Sys>>;
    bottomNavLinks?: LocalizedField<Array<Sys>>;
}

export interface GetNavResult {
    allLinkIds: string[];
    bottomLinkIds: string[];
}

export interface LinkData {
    id: string;
    view?: LocalizedField<Sys>;
    label?: LocalizedField<string>;
    links?: LocalizedField<SysLink[]>;
    contentType?: string;
}

export interface ViewData {
    id: string;
    primaryContent: LocalizedField<Sys[]>;
    topContent: LocalizedField<Sys[]>;
    liveHidden: LocalizedField<boolean>;
    classification: LocalizedField<string>;
}
