/**
 * OSClient Constants
 * Version: 1.0.1
 * Core constants for the OS Client library
 * Last updated: 2025-04-01-7
 */
/* -------------------------------- Indexes ------------------------------- */
/* ------------------- shared indexes ----------*/
export const VENTURES_INDEX = 'ventures';
export const VENTURES_INDEX_ALIAS = 'ventures-r';
export const GAME_V2_TYPE = 'gameV2';
export const SITEGAME_V2_TYPE = 'siteGameV2';
export const ML_BECAUSE_YOU_PLAYED_INDEX = 'vitruvian-ml-eu-games-recommender-content-based-recommendations-v1';
export const ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS = 'recommendations-because-you-played';
export const ML_RECOMMENDED_GAMES_ON_EXIT_INDEX = 'vitruvian-ai-games-similarity-v1';
export const ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS = 'games-similarity';
export const ML_GAMES_RECOMMENDER_INDEX = 'vitruvian-ml-eu-games-recommender-v2';
export const ML_GAMES_RECOMMENDER_INDEX_ALIAS = 'recommendations-suggested-for-you';
export const ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS = 'because-you-played';
export const ML_BECAUSE_YOU_PLAYED_X_ALIAS = 'because-you-played-x';
export const ML_BECAUSE_YOU_PLAYED_Y_ALIAS = 'because-you-played-y';
export const ML_BECAUSE_YOU_PLAYED_Z_ALIAS = 'because-you-played-z';
export const ML_RECENTLY_PLAYED_ALIAS = 'recently-played-r';
export const ML_GAME_SHUFFLE_ALIAS = 'game-shuffle-r';
/* ------------------- V2 indexes ----------*/
export const CATEGORIES_INDEX = 'categories';
export const CATEGORIES_INDEX_ALIAS = 'categories-r';
export const LAYOUTS_INDEX = 'layouts';
export const LAYOUTS_INDEX_ALIAS = 'layouts-r';
export const SECTIONS_INDEX = 'sections';
export const SECTIONS_INDEX_ALIAS = 'sections-r';
export const SECTIONS_INDEX_SHARED_ALIAS = 'all-sections';
export const SUGGESTED_GAMES_DEFAULTS_INDEX = 'ml-personalised-sections-defaults';
export const SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS = 'ml-sections-defaults-r';
export const GAMES_INDEX = 'games';
export const GAMES_INDEX_ALIAS = 'games-r';
export const GAMES_INDEX_V2_ALIAS = 'games-v2-r';
export const GAMES_V2_INDEX = 'games-v2';
export const GAMES_V2_INDEX_ALIAS = 'games-v2-r';
export const ARCHIVED_GAMES_WRITE_ALIAS = 'games-archived-w';
export const ARCHIVED_GAMES_READ_ALIAS = 'games-archived-r';

/* ------------------- V3 indexes ----------*/
export const NAVIGATION_INDEX = 'navigation';
export const NAVIGATION_INDEX_READ_ALIAS = 'navigation-r';
export const VIEW_INDEX = 'views';
export const VIEW_INDEX_READ_ALIAS = 'views-r';
export const GAMES_SECTION_INDEX = 'game-sections';
export const GAMES_SECTION_INDEX_READ_ALIAS = 'game-sections-r';
export const ML_SECTIONS_READ_ALIAS = 'ml-sections-r';
// The below alias is shared read alias for 'game-sections', 'marketing-sections', 'ml-personalised-sections'
export const ALL_SECTIONS_SHARED_READ_ALIAS = 'ig-sections';
export const IG_SECTIONS = 'game-sections';
export const IG_GAMES_V2_READ_ALIAS = 'games-v2-r';
export const IG_GAMES_V2_WRITE_ALIAS = 'games-v2-w';
export const THEME_SECTION_INDEX = 'themes';
export const THEME_INDEX_READ_ALIAS = 'themes-r';
// AB Testing
export const AB_VARIANT_INDEX_ALIAS = 'ab-variants-r';

// Query sizes
export const SECTION_GAMES_SECTION_RECORDS_LIMIT = 1000;
export const SECTION_VIEW_SIZE = 1;
export const SECTION_DOCUMENTS_PER_CATEGORIES_LIMIT = 100;
/* -------------------------------- Environment ------------------------------- */
export const VALID_ENVIRONMENTS = ['staging', 'production'];
export const DEFAULT_ENVIRONMENT = 'production';

/* -------------------------------- Classification ------------------------------- */
export const GAME_SECTION_CLASSIFICATION = 'GameSection';
export const JACKPOT_SECTION_CLASSIFICATION = 'JackpotSection';
export const PERSONALISED_SECTION_CLASSIFICATION = 'PersonalisedSection';
