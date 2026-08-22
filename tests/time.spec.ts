/**
 * Pure time-logic behavior: peak/non-peak classification, weekend handling,
 * countdown direction, formatting, and timezone fallback. Uses the UTC
 * timezone so the fixed clock windows (09:00–12:00, 14:00–18:00 on weekdays)
 * are asserted against deterministic instants. 2024-01-01 is a Monday.
 */
import { describe, expect, it } from 'vitest'
import {
  classifyPeak, formatCountdown, resolveTimeZone, secondsInTimeZone,
  DEFAULT_TIMEZONE,
} from '../src/client/time.ts'

const at = (iso: string): Date => new Date(iso)

describe('classifyPeak (UTC clock, weekdays)', () => {
  it('treats 08:59:59 as non-peak counting down to the 09:00 start', () => {
    expect(classifyPeak(at('2024-01-02T08:59:59Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 1,
    })
  })

  it('treats 09:00:00 as peak counting down to the 12:00 end', () => {
    expect(classifyPeak(at('2024-01-02T09:00:00Z'), 'UTC')).toEqual({
      peak: true,
      countdownSeconds: 3 * 3600,
    })
  })

  it('treats 11:59:59 as peak ending in one second', () => {
    expect(classifyPeak(at('2024-01-02T11:59:59Z'), 'UTC')).toEqual({
      peak: true,
      countdownSeconds: 1,
    })
  })

  it('treats the 12:00 lunch gap as non-peak counting down to 14:00', () => {
    expect(classifyPeak(at('2024-01-02T12:00:00Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 2 * 3600,
    })
  })

  it('treats 14:00:00 as the afternoon peak', () => {
    expect(classifyPeak(at('2024-01-02T14:00:00Z'), 'UTC')).toEqual({
      peak: true,
      countdownSeconds: 4 * 3600,
    })
  })

  it('treats Tuesday 18:00 as non-peak rolling to Wednesday 09:00', () => {
    expect(classifyPeak(at('2024-01-02T18:00:00Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 15 * 3600,
    })
  })
})

describe('classifyPeak (UTC clock, weekends)', () => {
  it('treats Friday 18:00 as non-peak rolling over the weekend to Monday 09:00', () => {
    expect(classifyPeak(at('2024-01-05T18:00:00Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 63 * 3600,
    })
  })

  it('treats Saturday 10:00 (inside the morning window) as non-peak', () => {
    expect(classifyPeak(at('2024-01-06T10:00:00Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 47 * 3600,
    })
  })

  it('treats Sunday 15:00 (inside the afternoon window) as non-peak', () => {
    expect(classifyPeak(at('2024-01-07T15:00:00Z'), 'UTC')).toEqual({
      peak: false,
      countdownSeconds: 18 * 3600,
    })
  })
})

describe('secondsInTimeZone', () => {
  it('reads Beijing time (UTC+8) from a UTC instant', () => {
    // 01:00 UTC = 09:00 Asia/Shanghai.
    expect(secondsInTimeZone(at('2024-01-02T01:00:00Z'), 'Asia/Shanghai')).toBe(9 * 3600)
  })
})

describe('resolveTimeZone', () => {
  it('falls back to the default for missing, empty, or unknown identifiers', () => {
    expect(resolveTimeZone(undefined)).toBe(DEFAULT_TIMEZONE)
    expect(resolveTimeZone('')).toBe(DEFAULT_TIMEZONE)
    expect(resolveTimeZone('Not/AZone')).toBe(DEFAULT_TIMEZONE)
  })

  it('keeps a valid identifier', () => {
    expect(resolveTimeZone('America/New_York')).toBe('America/New_York')
  })
})

describe('formatCountdown', () => {
  it('zero-pads into HH:MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(3661)).toBe('01:01:01')
    expect(formatCountdown(13 * 3600)).toBe('13:00:00')
  })

  it('clamps negative counts to zero', () => {
    expect(formatCountdown(-5)).toBe('00:00:00')
  })
})
