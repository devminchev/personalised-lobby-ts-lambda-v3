// ---------------------------------------------------------------------------
// Code-level configuration
// ---------------------------------------------------------------------------
//
// The six tunable timing knobs that used to live here as a BreakerSettings
// const are now sourced from AWS Systems Manager Parameter Store via
// `loadBreakerSettings` (src/settings.ts) so they can be retuned without a
// redeploy. See docs/resilience/configuration-store-decision.mdx for why
// Parameter Store + SDK + 60 s TTL was chosen over AppConfig and the SSM
// Lambda Extension.
//
// What stays here, deliberately, are the two signal sets below — they are
// not tunable knobs; they are the contract between this controller and the
// CloudWatch alarm names emitted by template.yaml. Changing a signal name in
// SSM would silently break alarm-name parsing rather than re-tune behaviour,
// which is the wrong shape of operational lever.

/**
 * Signals that individually trigger OPEN.
 * They map to the signal suffix of the alarm name: breaker:<service>:<signal>
 */
export const CRITICAL_SIGNALS = new Set(['os-search-rejections', 'os-write-rejections']);

/** Signals that trigger OPEN only when two or more are in ALARM simultaneously. */
export const WARNING_SIGNALS = new Set(['api-p99', 'api-5xx', 'jvm-pressure', 'cpu-high']);
