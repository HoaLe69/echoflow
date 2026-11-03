const DECIMAL_SECONDS = /^\d+(?:\.\d+)?$/
const COLON_TIME = /^\d+(?::\d+){1,2}$/
const UNIT_TIME = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format seconds as `m:ss`, or `h:mm:ss` once the video is an hour long. */
export function formatTime(seconds: number): string {
  const safeSeconds =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(remainder)}`
  return `${minutes}:${pad(remainder)}`
}

/**
 * Parse a timestamp into seconds. Accepts plain seconds (`90`), `m:ss`,
 * `h:mm:ss`, and YouTube's unit shorthand (`1m30s`, `2h`, `45s`).
 */
export function parseTime(value: string): number | null {
  const input = value.trim().toLowerCase()
  if (!input) return null

  if (DECIMAL_SECONDS.test(input)) return Number(input)

  if (COLON_TIME.test(input)) {
    const parts = input.split(':').map(Number)

    if (parts.length === 2) {
      const [minutes, seconds] = parts
      return minutes * 60 + seconds
    }

    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  const match = UNIT_TIME.exec(input)
  if (!match) return null

  const [, hours, minutes, seconds] = match
  if (!hours && !minutes && !seconds) return null

  return (
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  )
}
