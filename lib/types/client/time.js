/**
 * Pure peak-hours time computation. Peak windows are fixed on the clock:
 * 09:00–12:00 and 14:00–18:00, interpreted in the configured IANA timezone
 * (default Asia/Shanghai = UTC+8, no DST). Every function is pure over a
 * `Date` plus a timezone string, so it is unit-testable without the DOM.
 */
/** IANA timezone used when none (or an invalid one) is configured. */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai';
/** Peak windows, seconds after midnight. */
const MORNING_START = 9 * 3600;
const MORNING_END = 12 * 3600;
const AFTERNOON_START = 14 * 3600;
const AFTERNOON_END = 18 * 3600;
const DAY_SECONDS = 24 * 3600;
/**
 * Validate a timezone against Intl, returning the default when unusable.
 * @param timezone - the configured IANA timezone, or undefined for the default.
 * @returns the timezone to compute with.
 */
export function resolveTimeZone(timezone) {
    if (timezone === undefined || timezone === '')
        return DEFAULT_TIMEZONE;
    try {
        // Throws RangeError on an unknown identifier.
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
        return timezone;
    }
    catch {
        return DEFAULT_TIMEZONE;
    }
}
/**
 * Seconds since midnight for `now` interpreted in `timeZone`.
 * @param now - the instant to read.
 * @param timeZone - the IANA timezone to read it in.
 * @returns 0..86399.
 */
export function secondsInTimeZone(now, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(now);
    const get = (type) => Number(parts.find(part => part.type === type)?.value ?? 0);
    return get('hour') * 3600 + get('minute') * 60 + get('second');
}
/**
 * Classify one instant into peak/non-peak plus the seconds to the next boundary.
 * @param now - the instant to classify.
 * @param timeZone - the IANA timezone to read it in.
 * @returns the resolved state.
 */
export function classifyPeak(now, timeZone) {
    const seconds = secondsInTimeZone(now, timeZone);
    if (seconds >= MORNING_START && seconds < MORNING_END) {
        return { peak: true, countdownSeconds: MORNING_END - seconds };
    }
    if (seconds >= AFTERNOON_START && seconds < AFTERNOON_END) {
        return { peak: true, countdownSeconds: AFTERNOON_END - seconds };
    }
    const nextStart = seconds < MORNING_START
        ? MORNING_START
        : seconds < AFTERNOON_START
            ? AFTERNOON_START
            : MORNING_START + DAY_SECONDS;
    return { peak: false, countdownSeconds: nextStart - seconds };
}
/**
 * Format a non-negative second count as HH:MM:SS.
 * @param totalSeconds - the count to format.
 * @returns zero-padded HH:MM:SS.
 */
export function formatCountdown(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
//# sourceMappingURL=time.js.map