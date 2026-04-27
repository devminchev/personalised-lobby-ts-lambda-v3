export interface NoopPayload {
    updated: false;
    skipped: true;
    reason: string;
    message?: string;
    entryId?: string;
}

export const buildNoopPayload = (reason: string, options?: { message?: string; entryId?: string }): NoopPayload => ({
    updated: false,
    skipped: true,
    reason,
    ...(options?.message ? { message: options.message } : {}),
    ...(options?.entryId ? { entryId: options.entryId } : {}),
});
