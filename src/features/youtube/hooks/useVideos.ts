import { useCallback, useEffect, useRef, useState } from 'react'
import {
  countNotesByVideo,
  listVideos,
  softDeleteVideo,
} from '../db'
import type { Video } from '../types'

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current

    try {
      const [nextVideos, nextCounts] = await Promise.all([
        listVideos(),
        countNotesByVideo(),
      ])
      if (currentRequest !== requestId.current) return

      setVideos(nextVideos)
      setNoteCounts(nextCounts)
      setError(null)
    } catch (loadError) {
      if (currentRequest !== requestId.current) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load your videos.',
      )
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  const removeVideo = useCallback(
    async (id: string) => {
      await softDeleteVideo(id)
      await reload()
    },
    [reload],
  )

  return { videos, noteCounts, isLoading, error, reload, removeVideo }
}
