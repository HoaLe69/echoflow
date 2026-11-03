import { describe, expect, it } from 'vitest'
import { formatTime, parseTime } from './time'

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [59, '0:59'],
    [60, '1:00'],
    [90, '1:30'],
    [599, '9:59'],
    [600, '10:00'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3661, '1:01:01'],
    [7325, '2:02:05'],
  ])('formats %s seconds as %s', (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected)
  })

  it('clamps negative and non-finite values', () => {
    expect(formatTime(-10)).toBe('0:00')
    expect(formatTime(Number.NaN)).toBe('0:00')
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00')
  })

  it('floors fractional seconds', () => {
    expect(formatTime(90.9)).toBe('1:30')
  })
})

describe('parseTime', () => {
  it.each([
    ['0', 0],
    ['90', 90],
    ['1:30', 90],
    ['01:05', 65],
    ['1:02:03', 3723],
    ['10:00', 600],
    ['30s', 30],
    ['2m', 120],
    ['1m30s', 90],
    ['2h', 7200],
    ['1h2m3s', 3723],
    ['  1:30  ', 90],
    ['1M30S', 90],
  ])('parses %s as %s seconds', (input, expected) => {
    expect(parseTime(input)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '1:2:3:4', '1h30', '-5', '1.2.3', '1:xx'])(
    'rejects %s',
    (input) => {
      expect(parseTime(input)).toBeNull()
    },
  )

  it('round-trips formatted times', () => {
    for (const seconds of [0, 5, 59, 60, 90, 599, 600, 3599, 3600, 3661]) {
      expect(parseTime(formatTime(seconds))).toBe(seconds)
    }
  })
})
