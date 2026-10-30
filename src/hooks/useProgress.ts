import { useCallback, useEffect, useState } from 'react'
import type { Progress } from '../types/scenario'

export type ProgressMap = Record<string, Progress>

export type ProgressDelta = {
  /** Reps to add; defaults to 1. */
  reps?: number
  /** Latest fluency score (0–100). */
  fluencyScore?: number
}

export type UseProgressResult = {
  progress: ProgressMap
  getProgress: (scenarioId: string) => Progress
  toggleFavorite: (scenarioId: string) => void
  recordAttempt: (scenarioId: string, delta?: ProgressDelta) => void
}

const STORAGE_KEY = 'echoflow:progress:v1'
const EMPTY_PROGRESS: Progress = { reps: 0, favorite: false }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100)
}

function parseProgress(raw: string): ProgressMap {
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

function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parseProgress(raw) : {}
  } catch {
    // Storage unavailable (private mode, blocked cookies).
    return {}
  }
}

function saveProgress(progress: ProgressMap): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Quota exceeded / storage disabled: keep working in memory.
  }
}

export function useProgress(): UseProgressResult {
  // Lazy initializer reads synchronously, so there is no empty first paint.
  const [progress, setProgress] = useState<ProgressMap>(loadProgress)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  // Keep multiple tabs in sync.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return

      const next = event.newValue ? parseProgress(event.newValue) : {}
      // Preserve identity when nothing changed to avoid re-render / write loops.
      setProgress((current) =>
        JSON.stringify(next) === JSON.stringify(current) ? current : next,
      )
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const getProgress = useCallback(
    (scenarioId: string) => progress[scenarioId] ?? EMPTY_PROGRESS,
    [progress],
  )

  const toggleFavorite = useCallback((scenarioId: string) => {
    setProgress((current) => {
      const existing = current[scenarioId] ?? EMPTY_PROGRESS

      return {
        ...current,
        [scenarioId]: {
          ...existing,
          favorite: !existing.favorite,
        },
      }
    })
  }, [])

  const recordAttempt = useCallback(
    (scenarioId: string, delta: ProgressDelta = {}) => {
      setProgress((current) => {
        const existing = current[scenarioId] ?? EMPTY_PROGRESS
        const repsDelta = delta.reps ?? 1
        const reps = Math.max(
          0,
          existing.reps +
          (Number.isFinite(repsDelta) ? Math.round(repsDelta) : 0),
        )

        const fluencyScore =
          delta.fluencyScore !== undefined &&
            Number.isFinite(delta.fluencyScore)
            ? clampScore(delta.fluencyScore)
            : existing.fluencyScore

        return {
          ...current,
          [scenarioId]: {
            reps,
            ...(fluencyScore !== undefined ? { fluencyScore } : {}),
            favorite: existing.favorite,
          },
        }
      })
    },
    [],
  )

  return { progress, getProgress, toggleFavorite, recordAttempt }
}
