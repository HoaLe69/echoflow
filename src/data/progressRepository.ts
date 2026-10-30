import type { Progress } from '../types/scenario'

export type ProgressMap = Record<string, Progress>

export const PROGRESS_STORAGE_KEY = 'echoflow:progress:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100)
}

export function parseProgress(raw: string): ProgressMap {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (!isRecord(parsed)) return {}

  const progress: ProgressMap = {}

  for (const [scenarioId, value] of Object.entries(parsed)) {
    if (!isRecord(value)) continue

    const rawReps = value.reps
    const reps =
      typeof rawReps === 'number' &&
      Number.isFinite(rawReps) &&
      rawReps >= 0
        ? Math.floor(rawReps)
        : 0

    const favorite = value.favorite === true

    const rawScore = value.fluencyScore
    const fluencyScore =
      typeof rawScore === 'number' && Number.isFinite(rawScore)
        ? clampScore(rawScore)
        : undefined

    progress[scenarioId] = {
      reps,
      ...(fluencyScore !== undefined ? { fluencyScore } : {}),
      favorite,
    }
  }

  return progress
}

export function readProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    return raw ? parseProgress(raw) : {}
  } catch {
    return {}
  }
}

export function writeProgress(progress: ProgressMap): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(progress),
    )
  } catch {
    // Quota exceeded / storage disabled: keep working in memory.
  }
}
