/**
 * Pure peak-hours time computation. Peak windows are fixed on the clock:
 * 09:00–12:00 and 14:00–18:00, interpreted in the configured IANA timezone
 * (default Asia/Shanghai = UTC+8, no DST). Every function is pure over a
 * `Date` plus a timezone string, so it is unit-testable without the DOM.
 */
/** IANA timezone used when none (or an invalid one) is configured. */
export declare const DEFAULT_TIMEZONE = "Asia/Shanghai";
/** Resolved state for one clock tick. */
export interface PeakState {
    /** Whether the clock is inside a peak window. */
    peak: boolean;
    /**
     * Seconds until the next boundary: peak → the current window's end,
     * non-peak → the next window's start (rolling past midnight).
     */
    countdownSeconds: number;
}
/**
 * Validate a timezone against Intl, returning the default when unusable.
 * @param timezone - the configured IANA timezone, or undefined for the default.
 * @returns the timezone to compute with.
 */
export declare function resolveTimeZone(timezone: string | undefined): string;
/**
 * Seconds since midnight for `now` interpreted in `timeZone`.
 * @param now - the instant to read.
 * @param timeZone - the IANA timezone to read it in.
 * @returns 0..86399.
 */
export declare function secondsInTimeZone(now: Date, timeZone: string): number;
/**
 * Classify one instant into peak/non-peak plus the seconds to the next boundary.
 * @param now - the instant to classify.
 * @param timeZone - the IANA timezone to read it in.
 * @returns the resolved state.
 */
export declare function classifyPeak(now: Date, timeZone: string): PeakState;
/**
 * Format a non-negative second count as HH:MM:SS.
 * @param totalSeconds - the count to format.
 * @returns zero-padded HH:MM:SS.
 */
export declare function formatCountdown(totalSeconds: number): string;
//# sourceMappingURL=time.d.ts.map