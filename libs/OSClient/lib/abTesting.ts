/**
 * A/B Testing
 * Shared constants and helpers for A/B variant dispatch in Lambda entry points.
 */

export const AB_VARIANT_HEADER = 'X-LOBBY-VARIANT';

export enum AbVariant {
    Treatment = 'treatment',
    Control = 'control',
    Unaffected = 'unaffected',
}

export const isAbVariant = (value: unknown): value is AbVariant =>
    typeof value === 'string' && (Object.values(AbVariant) as string[]).includes(value);
