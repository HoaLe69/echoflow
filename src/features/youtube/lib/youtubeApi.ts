export const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export type YouTubePlayerState =
  (typeof YOUTUBE_PLAYER_STATE)[keyof typeof YOUTUBE_PLAYER_STATE]

export type YouTubePlayerEvent = {
  target: YouTubePlayerInstance
  data: number
}

export type YouTubeReadyEvent = {
  target: YouTubePlayerInstance
}

export type YouTubePlayerOptions = {
  width?: number | string
  height?: number | string
  videoId: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: YouTubeReadyEvent) => void
    onStateChange?: (event: YouTubePlayerEvent) => void
    onError?: (event: YouTubePlayerEvent) => void
  }
}

export interface YouTubePlayerInstance {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setPlaybackRate: (rate: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  destroy: () => void
  getIframe: () => HTMLIFrameElement
}

export type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: YouTubePlayerOptions,
  ) => YouTubePlayerInstance
  PlayerState: typeof YOUTUBE_PLAYER_STATE
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'
const LOAD_TIMEOUT_MS = 15_000

let apiPromise: Promise<YouTubeApi> | null = null

function isPlayerApi(value: unknown): value is YouTubeApi {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as { Player?: unknown }).Player === 'function'
}

/**
 * Load the official IFrame API once and share the promise across every caller.
 * StrictMode double-mounting therefore never injects a second script.
 */
export function loadYouTubeApi(): Promise<YouTubeApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('The YouTube player needs a browser.'))
  }

  if (isPlayerApi(window.YT)) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    let settled = false
    let timeout = 0

    const finish = (action: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      action()
    }

    timeout = window.setTimeout(
      () =>
        finish(() =>
          reject(new Error('The YouTube player took too long to load.')),
        ),
      LOAD_TIMEOUT_MS,
    )

    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()

      if (isPlayerApi(window.YT)) {
        finish(() => resolve(window.YT as YouTubeApi))
      } else {
        finish(() =>
          reject(new Error('YouTube loaded without a player API.')),
        )
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${API_SRC}"]`,
    )

    if (existing) {
      existing.addEventListener(
        'error',
        () =>
          finish(() =>
            reject(new Error('Could not load the YouTube player.')),
          ),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    script.addEventListener(
      'error',
      () =>
        finish(() =>
          reject(new Error('Could not load the YouTube player.')),
        ),
      { once: true },
    )
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    apiPromise = null
    throw error
  })

  return apiPromise
}

export function isYouTubePlayerState(
  value: number,
): value is YouTubePlayerState {
  return (
    value === YOUTUBE_PLAYER_STATE.UNSTARTED ||
    value === YOUTUBE_PLAYER_STATE.ENDED ||
    value === YOUTUBE_PLAYER_STATE.PLAYING ||
    value === YOUTUBE_PLAYER_STATE.PAUSED ||
    value === YOUTUBE_PLAYER_STATE.BUFFERING ||
    value === YOUTUBE_PLAYER_STATE.CUED
  )
}
