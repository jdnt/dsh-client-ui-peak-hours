/**
 * Pure peak-hours time computation. Peak windows are fixed on the clock:
 * 09:00–12:00 and 14:00–18:00 on weekdays, interpreted in the configured IANA
 * timezone (default Asia/Shanghai = UTC+8, no DST). Saturday and Sunday are
 * non-peak all day. Every function is pure over a `Date` plus a timezone
 * string, so it is unit-testable without the DOM.
 */

/** IANA timezone used when none (or an invalid one) is configured. */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai'

/** Peak windows, seconds after midnight. */
const MORNING_START = 9 * 3600
const MORNING_END = 12 * 3600
const AFTERNOON_START = 14 * 3600
const AFTERNOON_END = 18 * 3600
const DAY_SECONDS = 24 * 3600

/** Weekday indices returned by {@link weekdayInTimeZone}. */
const SUNDAY = 0
const FRIDAY = 5
const SATURDAY = 6

/** Resolved state for one clock tick. */
export interface PeakState {
  /** Whether the clock is inside a peak window. */
  peak: boolean
  /**
   * Seconds until the next boundary: peak → the current window's end,
   * non-peak → the next window's start (rolling past midnight and weekends).
   */
  countdownSeconds: number
}

/**
 * Validate a timezone against Intl, returning the default when unusable.
 * @param timezone - the configured IANA timezone, or undefined for the default.
 * @returns the timezone to compute with.
 */
export function resolveTimeZone(timezone: string | undefined): string {
  if (timezone === undefined || timezone === '') return DEFAULT_TIMEZONE
  try {
    // Throws RangeError on an unknown identifier.
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return timezone
  } catch {
    return DEFAULT_TIMEZONE
  }
}

/**
 * Seconds since midnight for `now` interpreted in `timeZone`.
 * @param now - the instant to read.
 * @param timeZone - the IANA timezone to read it in.
 * @returns 0..86399.
 */
export function secondsInTimeZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now)
  const get = (type: string): number => Number(parts.find(part => part.type === type)?.value ?? 0)
  return get('hour') * 3600 + get('minute') * 60 + get('second')
}

/** Weekday abbreviations to their `Date.getDay()`-style index. */
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/**
 * Day-of-week for `now` interpreted in `timeZone`, as `Date.getDay()` would
 * return it (0 = Sunday … 6 = Saturday).
 * @param now - the instant to read.
 * @param timeZone - the IANA timezone to read it in.
 * @returns 0..6.
 */
export function weekdayInTimeZone(now: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
    .formatToParts(now)
    .find(entry => entry.type === 'weekday')
  return WEEKDAY_INDEX[part?.value ?? ''] ?? SUNDAY
}

/** Whether the weekday index is Saturday or Sunday. */
function isWeekend(weekday: number): boolean {
  return weekday === SATURDAY || weekday === SUNDAY
}

/** Whole days from `weekday` to the next weekday 09:00, skipping the weekend. */
function daysToNextPeakStart(weekday: number): number {
  switch (weekday) {
    case FRIDAY: return 3 // Friday → Monday
    case SATURDAY: return 2 // Saturday → Monday
    case SUNDAY: return 1 // Sunday → Monday
    default: return 1 // Monday–Thursday → next day
  }
}

/** Seconds from a non-peak instant to the next peak start (next weekday 09:00). */
function secondsToNextPeakStart(weekday: number, seconds: number): number {
  return daysToNextPeakStart(weekday) * DAY_SECONDS - seconds + MORNING_START
}

/**
 * Classify one instant into peak/non-peak plus the seconds to the next boundary.
 * Weekends are non-peak all day.
 * @param now - the instant to classify.
 * @param timeZone - the IANA timezone to read it in.
 * @returns the resolved state.
 */
export function classifyPeak(now: Date, timeZone: string): PeakState {
  const seconds = secondsInTimeZone(now, timeZone)
  const weekday = weekdayInTimeZone(now, timeZone)
  if (isWeekend(weekday)) {
    return { peak: false, countdownSeconds: secondsToNextPeakStart(weekday, seconds) }
  }
  if (seconds >= MORNING_START && seconds < MORNING_END) {
    return { peak: true, countdownSeconds: MORNING_END - seconds }
  }
  if (seconds >= AFTERNOON_START && seconds < AFTERNOON_END) {
    return { peak: true, countdownSeconds: AFTERNOON_END - seconds }
  }
  if (seconds < MORNING_START) {
    return { peak: false, countdownSeconds: MORNING_START - seconds }
  }
  if (seconds < AFTERNOON_START) {
    return { peak: false, countdownSeconds: AFTERNOON_START - seconds }
  }
  return { peak: false, countdownSeconds: secondsToNextPeakStart(weekday, seconds) }
}

/**
 * Format a non-negative second count as HH:MM:SS.
 * @param totalSeconds - the count to format.
 * @returns zero-padded HH:MM:SS.
 */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
