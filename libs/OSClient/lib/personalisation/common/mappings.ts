import {
    ML_GAMES_RECOMMENDER_INDEX_ALIAS,
    ML_BECAUSE_YOU_PLAYED_X_ALIAS,
    ML_BECAUSE_YOU_PLAYED_Y_ALIAS,
    ML_BECAUSE_YOU_PLAYED_Z_ALIAS,
    ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS,
    ML_RECENTLY_PLAYED_ALIAS,
} from '../../constants';

export const ML_RECOMMENDED_GAMES_SIZE = 50;

export const mlPersonalizedSections = [
    'personal-suggested-games',
    'recently-played',
    'because-you-played-x',
    'because-you-played-y',
    'because-you-played-z',
    'on-exit-recommendations',
    'because-you-played',
] as const;

export type IMlPersonalizedSection = (typeof mlPersonalizedSections)[number];

export const personalisedSectionsToMlIndex: Partial<Record<IMlPersonalizedSection, string>> = {
    'personal-suggested-games': ML_GAMES_RECOMMENDER_INDEX_ALIAS,
    'because-you-played': ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS,
    'because-you-played-x': ML_BECAUSE_YOU_PLAYED_X_ALIAS,
    'because-you-played-y': ML_BECAUSE_YOU_PLAYED_Y_ALIAS,
    'because-you-played-z': ML_BECAUSE_YOU_PLAYED_Z_ALIAS,
    'recently-played': ML_RECENTLY_PLAYED_ALIAS,
};
