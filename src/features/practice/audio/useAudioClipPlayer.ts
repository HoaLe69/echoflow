import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioSource } from '../../../data/audioRepository'

type AudioError = {
  sourceId: string
  message: string
}

export function useAudioClipPlayer(sourceId: string | undefined) {
  const [loadedSourceId, setLoadedSourceId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [audioError, setAudioError] = useState<AudioError | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const stopAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!sourceId) return

    let cancelled = false

    getAudioSource(sourceId)
      .then((record) => {
        if (cancelled) return
        if (!record) {
          setAudioError({
            sourceId,
            message: 'Audio source not found.',
          })
          return
        }

        const url = URL.createObjectURL(record.blob)
        const audio = new Audio(url)
        audio.preload = 'auto'

        audio.addEventListener('play', () => {
          setIsPlaying(true)
          setAutoplayBlocked(false)
        })
        audio.addEventListener('pause', () => setIsPlaying(false))
        audio.addEventListener('ended', () => setIsPlaying(false))

        audioRef.current = audio
        urlRef.current = url
        setLoadedSourceId(sourceId)
        setAutoplayBlocked(false)
        setAudioError(null)
      })
      .catch((loadError) => {
        if (cancelled) return
        setAudioError({
          sourceId,
          message:
            loadError instanceof Error
              ? loadError.message
              : 'Could not load the audio source.',
        })
      })

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      audioRef.current = null
      urlRef.current = null
      stopAtRef.current = null
    }
  }, [sourceId])

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    stopAtRef.current = null
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
  }, [])

  const playSegment = useCallback(
    (startMs: number, endMs: number, rate = 1) => {
      const audio = audioRef.current
      if (!audio) return

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      audio.pause()
      audio.currentTime = Math.max(0, startMs / 1000)
      audio.playbackRate = rate
      stopAtRef.current = endMs / 1000

      const tick = () => {
        const current = audioRef.current
        if (!current || stopAtRef.current === null) {
          rafRef.current = null
          return
        }

        if (current.currentTime >= stopAtRef.current) {
          current.pause()
          stopAtRef.current = null
          rafRef.current = null
          return
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      void audio.play().catch((playError) => {
        // Mobile browsers require a user gesture before audio can start.
        // Surface a retry banner instead of failing silently.
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          setAutoplayBlocked(true)
          return
        }

        if (!sourceId) return
        setAudioError({
          sourceId,
          message:
            playError instanceof Error
              ? playError.message
              : 'Audio playback failed.',
        })
      })
      rafRef.current = requestAnimationFrame(tick)
    },
    [sourceId],
  )

  const isReady = Boolean(sourceId) && loadedSourceId === sourceId
  const error =
    sourceId && audioError?.sourceId === sourceId ? audioError.message : null

  return {
    isReady,
    isPlaying,
    autoplayBlocked,
    error,
    playSegment,
    stop,
  }
}
