import { useCallback, useEffect, useState } from 'react'
import {
  PROGRESS_STORAGE_KEY,
  parseProgress,
  readProgress,
  writeProgress,
  type ProgressMap,
} from '../data/progressRepository'
import type { Progress } from '../types/scenario'

export type { ProgressMap } from '../data/progressRepository'

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

const EMPTY_PROGRESS: Progress = { reps: 0, favorite: false }

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100)
}

export function useProgress(): UseProgressResult {
  // Lazy initializer reads synchronously, so there is no empty first paint.
  const [progress, setProgress] = useState<ProgressMap>(readProgress)

  useEffect(() => {
    writeProgress(progress)
  }, [progress])

  // Keep multiple tabs in sync.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PROGRESS_STORAGE_KEY) return

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
