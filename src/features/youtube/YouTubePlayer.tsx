import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import Icon from '../../components/Icon'
import { useYouTubeApi } from './hooks/useYouTubeApi'
import {
  YOUTUBE_PLAYER_STATE,
  isYouTubePlayerState,
} from './lib/youtubeApi'
import type {
  YouTubePlayerEvent,
  YouTubePlayerInstance,
  YouTubePlayerState,
} from './lib/youtubeApi'

export type YouTubePlayerHandle = {
  play: () => void
  pause: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  setRate: (rate: number) => void
  getTime: () => number
}

type YouTubePlayerProps = {
  videoId: string
  /** Seek here once the player is ready. Does not autoplay. */
  initialTime?: number
  playbackRate?: number
  onTime?: (seconds: number) => void
  onStateChange?: (state: YouTubePlayerState) => void
  onError?: (code: number) => void
  onReady?: (durationSeconds: number) => void
  className?: string
}

function readPlayerTime(player: YouTubePlayerInstance): number {
  try {
    const seconds = player.getCurrentTime()
    return Number.isFinite(seconds) ? seconds : 0
  } catch {
    return 0
  }
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer(
    {
      videoId,
      initialTime = 0,
      playbackRate = 1,
      onTime,
      onStateChange,
      onError,
      onReady,
      className = '',
    },
    ref,
  ) {
    const { api, error: apiError, retry } = useYouTubeApi()
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<YouTubePlayerInstance | null>(null)
    const rateRef = useRef(playbackRate)
    const initialTimeRef = useRef(initialTime)
    const callbacksRef = useRef({ onTime, onStateChange, onError, onReady })

    useEffect(() => {
      callbacksRef.current = { onTime, onStateChange, onError, onReady }
    }, [onTime, onStateChange, onError, onReady])

    useEffect(() => {
      initialTimeRef.current = initialTime
    }, [initialTime])

    useEffect(() => {
      const player = playerRef.current
      if (!player || initialTime < 0) return

      try {
        player.seekTo(initialTime, true)
      } catch {
        // The player may still be initializing.
      }
      callbacksRef.current.onTime?.(initialTime)
    }, [initialTime])

    useEffect(() => {
      rateRef.current = playbackRate
      const player = playerRef.current
      if (!player) return

      try {
        player.setPlaybackRate(playbackRate)
      } catch {
        // The player may still be initializing; onReady/PLAYING reapply it.
      }
    }, [playbackRate])

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          try {
            playerRef.current?.playVideo()
          } catch {
            // The player is not ready yet.
          }
        },
        pause: () => {
          try {
            playerRef.current?.pauseVideo()
          } catch {
            // The player is not ready yet.
          }
        },
        seekTo: (seconds, allowSeekAhead = true) => {
          try {
            playerRef.current?.seekTo(Math.max(0, seconds), allowSeekAhead)
          } catch {
            // The player is not ready yet.
          }
        },
        setRate: (rate) => {
          rateRef.current = rate
          try {
            playerRef.current?.setPlaybackRate(rate)
          } catch {
            // The player is not ready yet.
          }
        },
        getTime: () => {
          const player = playerRef.current
          return player ? readPlayerTime(player) : 0
        },
      }),
      [],
    )

    useEffect(() => {
      if (!api) return

      const container = containerRef.current
      if (!container) return

      let disposed = false
      let pollId: number | null = null
      let player: YouTubePlayerInstance | null = null

      const host = document.createElement('div')
      host.className = 'h-full w-full'
      container.replaceChildren(host)

      const stopPolling = () => {
        if (pollId === null) return
        window.clearInterval(pollId)
        pollId = null
      }

      const emitTime = (target: YouTubePlayerInstance) => {
        if (disposed) return
        callbacksRef.current.onTime?.(readPlayerTime(target))
      }

      const applyRate = (target: YouTubePlayerInstance) => {
        try {
          target.setPlaybackRate(rateRef.current)
        } catch {
          // Loading a new video resets the rate; the next state event retries.
        }
      }

      const startPolling = (target: YouTubePlayerInstance) => {
        if (pollId !== null) return

        pollId = window.setInterval(() => {
          if (disposed) return
          callbacksRef.current.onTime?.(readPlayerTime(target))
        }, 250)
      }

      const handleStateChange = (event: YouTubePlayerEvent) => {
        if (disposed || !isYouTubePlayerState(event.data)) return

        const { target } = event
        callbacksRef.current.onStateChange?.(event.data)

        if (event.data === YOUTUBE_PLAYER_STATE.PLAYING) {
          emitTime(target)
          applyRate(target)
          startPolling(target)
          return
        }

        stopPolling()

        if (
          event.data === YOUTUBE_PLAYER_STATE.PAUSED ||
          event.data === YOUTUBE_PLAYER_STATE.ENDED
        ) {
          emitTime(target)
        }

        if (event.data === YOUTUBE_PLAYER_STATE.CUED) applyRate(target)
      }

      const handleError = (event: YouTubePlayerEvent) => {
        if (disposed) return
        stopPolling()
        callbacksRef.current.onError?.(event.data)
      }

      try {
        player = new api.Player(host, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              if (disposed) return

              playerRef.current = event.target
              applyRate(event.target)

              if (initialTimeRef.current > 0) {
                try {
                  event.target.seekTo(initialTimeRef.current, true)
                } catch {
                  // Seeking before the media is ready is best-effort.
                }
                callbacksRef.current.onTime?.(initialTimeRef.current)
              }

              let duration = 0
              try {
                duration = event.target.getDuration()
              } catch {
                // Duration is optional.
              }

              callbacksRef.current.onReady?.(duration)
            },
            onStateChange: handleStateChange,
            onError: handleError,
          },
        })
        playerRef.current = player
      } catch {
        callbacksRef.current.onError?.(5)
      }

      return () => {
        disposed = true
        stopPolling()
        playerRef.current = null

        try {
          player?.destroy()
        } catch {
          // The player may have been removed by the API already.
        }

        host.remove()
        container.replaceChildren()
      }
    }, [api, videoId])

    if (apiError) {
      return (
        <div
          role="alert"
          className={`flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-error/20 bg-surface-container-low px-6 text-center ${className}`}
        >
          <Icon name="error" className="text-3xl text-error" />
          <p className="text-sm font-semibold text-on-error-container">
            {apiError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="focus-ring rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm"
          >
            Try again
          </button>
        </div>
      )
    }

    if (!api) {
      return (
        <div
          role="status"
          className={`flex aspect-video w-full items-center justify-center rounded-2xl bg-matcha-forest ${className}`}
        >
          <p className="text-sm font-semibold text-white/80">Loading player…</p>
        </div>
      )
    }

    return (
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black ${className}`}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>
    )
  },
)

YouTubePlayer.displayName = 'YouTubePlayer'

export default YouTubePlayer
