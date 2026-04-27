// Robust external version computation (updatedAt + cmsChangeVersion) WITHOUT BigInt
// Strategy: externalVersion = updatedAtMs * MULT + (cmsChangeVersion % MULT)
//
// MULT = 2048 gives you 2048 distinct slots per millisecond and stays below Number.MAX_SAFE_INTEGER
// through 2060 (and beyond), assuming updatedAtMs is epoch millis.
import { createError, ErrorCode, getErrorMessage } from 'os-client';

const MULT = 2048;

const parseEpochMsNumber = (iso: string): number => {
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms) || ms <= 0) {
        throw createError(
            ErrorCode.InvalidVersionTimestamp,
            500,
            `${getErrorMessage(ErrorCode.InvalidVersionTimestamp)}: ${iso}`,
        );
    }
    return ms;
};

const parseCmsChangeVersionNumber = (v: unknown): number => {
    if (v === null || v === undefined || v === '') return 0;

    if (typeof v === 'number') {
        if (!Number.isFinite(v) || v < 0) return 0;
        return Math.trunc(v);
    }

    const s = String(v);
    if (!/^\d+$/.test(s)) return 0;

    // This is usually small (Contentful sys.version), safe as number.
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.trunc(n);
};

export const computeExternalVersionNumber = (updatedAtIso: string, cmsChangeVersion: unknown): number => {
    const updatedAtMs = parseEpochMsNumber(updatedAtIso);
    const ver = parseCmsChangeVersionNumber(cmsChangeVersion);

    // Ensure we never exceed JS safe-integer range
    const maxMsAllowed = Math.floor(Number.MAX_SAFE_INTEGER / MULT);
    if (updatedAtMs > maxMsAllowed) {
        throw createError(
            ErrorCode.InvalidVersionValue,
            500,
            `${getErrorMessage(ErrorCode.InvalidVersionValue)} (updatedAtMs=${updatedAtMs}, max=${maxMsAllowed})`,
        );
    }

    // Tie-breaker within same millisecond (0..MULT-1)
    const tie = ver % MULT;

    const externalVersion = updatedAtMs * MULT + tie;

    // Defensive: ensure it's a safe integer
    if (!Number.isSafeInteger(externalVersion) || externalVersion <= 0) {
        throw createError(
            ErrorCode.InvalidVersionValue,
            500,
            `${getErrorMessage(ErrorCode.InvalidVersionValue)}: ${externalVersion}`,
        );
    }

    return externalVersion;
};
