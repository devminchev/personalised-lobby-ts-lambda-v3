import { AbVariant } from 'os-client';

export type VariantDocument = {
    variant: AbVariant;
    cluster_label: number;
    venture: string;
    expiry?: string;
};

const createFutureExpiry = (): string => {
    return new Date(Date.now() + 60_000).toISOString();
};

const createPastExpiry = (): string => {
    return new Date(Date.now() - 60_000).toISOString();
};

export const buildVariantDocument = (overrides: Partial<VariantDocument> = {}): VariantDocument => {
    const base: VariantDocument = {
        variant: AbVariant.Treatment,
        cluster_label: 123,
        venture: 'rainbowriches',
        expiry: createFutureExpiry(),
    };

    return {
        ...base,
        ...overrides,
    };
};

export const activeVariantDocument = (): VariantDocument => {
    return buildVariantDocument();
};

export const mismatchVariantDocument = (): VariantDocument => {
    return buildVariantDocument({ venture: 'another-venture' });
};

export const missingExpiryVariantDocument = (): VariantDocument => {
    return buildVariantDocument({ expiry: undefined });
};

export const expiredVariantDocument = (): VariantDocument => {
    return buildVariantDocument({ expiry: createPastExpiry() });
};

export const invalidExpiryVariantDocument = (): VariantDocument => {
    return buildVariantDocument({ expiry: 'not-a-valid-date' });
};
