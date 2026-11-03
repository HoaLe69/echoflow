import { useCallback, useEffect, useRef, useState } from 'react'
import { listNotesForVideo } from '../db'
import type { Note } from '../types'

export function useNotes(videoId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    if (!videoId) return
    const currentRequest = ++requestId.current

    try {
      const nextNotes = await listNotesForVideo(videoId)
      if (currentRequest !== requestId.current) return

      setNotes(nextNotes)
      setError(null)
    } catch (loadError) {
      if (currentRequest !== requestId.current) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load your notes.',
      )
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  return { notes, isLoading, error, reload }
}
