import { useCallback, useEffect, useState } from 'react'
import { loadYouTubeApi } from '../lib/youtubeApi'
import type { YouTubeApi } from '../lib/youtubeApi'

export function useYouTubeApi() {
  const [api, setApi] = useState<YouTubeApi | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    // oxlint-disable-next-line react/set-state-in-effect
    setError(null)

    loadYouTubeApi()
      .then((loaded) => {
        if (active) setApi(loaded)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load the YouTube player.',
        )
      })

    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setApi(null)
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  return { api, error, retry }
}
