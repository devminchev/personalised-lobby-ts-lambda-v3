import { createError, ErrorCode, logError } from '../../errors';
import { IMlPersonalizedSection, mlPersonalizedSections, personalisedSectionsToMlIndex } from './mappings';
import { OrderCriteria, OrderCriteriaContentful } from './interfaces';

export const getMlIndexForSection = (sectionType: IMlPersonalizedSection): string =>
    personalisedSectionsToMlIndex[sectionType] || ''; //TODO: Decide how to handle here going onwards

export const isMlPersonalizedSection = (sectionType: string): sectionType is IMlPersonalizedSection => {
    return mlPersonalizedSections.includes(sectionType as IMlPersonalizedSection);
};

export const shouldTerminateRequest = (isLoggedIn: boolean, sectionType: IMlPersonalizedSection): boolean =>
    !isLoggedIn && isMlPersonalizedSection(sectionType);

export const checkAndGuardSectionType = async (
    isLoggedIn: boolean,
    sectionType: IMlPersonalizedSection | string,
    siteName: string,
    platform: string,
): Promise<boolean> => {
    const isSectionPersonalised = isMlPersonalizedSection(sectionType);

    // If the section is personalized but there is no authentication we should terminate the request, and throw an error
    if (isSectionPersonalised && !isLoggedIn) {
        logError(
            ErrorCode.BadWolf,
            400,
            { siteName, platform, sectionType, isLoggedIn },
            'Unauthenticated request for Personalised section!',
        );
        throw createError(ErrorCode.BadWolf, 400);
    }

    return isSectionPersonalised;
};

export const checkIsClassificationPersonalised = (
    isLoggedIn: boolean,
    classification: 'PersonalisedSection' | string,
): boolean => {
    return isLoggedIn && classification === 'PersonalisedSection';
};

export const ORDER_CRITERIA_TO_FIELD: Record<OrderCriteriaContentful, OrderCriteria> = {
    none: 'margin_rank',
    margin: 'margin_rank',
    rtp: 'rtp',
    wagered_amount: 'wager',
    rounds_played: 'rounds',
};
