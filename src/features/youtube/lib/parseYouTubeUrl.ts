import { parseTime } from './time'

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const SCHEME = /^[a-z][a-z0-9+.-]*:/i
const VIDEO_PATH_KINDS = new Set(['shorts', 'embed', 'live'])

export type ParsedYouTubeUrl = {
  videoId: string
  startSec?: number
}

export function isYouTubeVideoId(value: string): boolean {
  return VIDEO_ID.test(value)
}

function isYouTubeHost(hostname: string): boolean {
  return (
    hostname === 'youtube.com' ||
    hostname.endsWith('.youtube.com') ||
    hostname === 'youtube-nocookie.com' ||
    hostname.endsWith('.youtube-nocookie.com')
  )
}

function isShortHost(hostname: string): boolean {
  return hostname === 'youtu.be' || hostname === 'www.youtu.be'
}

function readVideoId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase()
  const segments = url.pathname.split('/').filter(Boolean)

  if (isShortHost(hostname)) {
    return segments.length === 1 ? segments[0] : null
  }

  if (!isYouTubeHost(hostname) || segments.length === 0) return null

  if (segments[0] === 'watch') {
    return segments.length === 1 ? url.searchParams.get('v') : null
  }

  if (VIDEO_PATH_KINDS.has(segments[0])) {
    return segments.length === 2 ? segments[1] : null
  }

  return null
}

function readStartSec(url: URL): number | undefined {
  for (const key of ['t', 'start']) {
    const raw = url.searchParams.get(key)
    if (!raw) continue

    const seconds = parseTime(raw)
    if (seconds !== null) return seconds
  }

  return undefined
}

/** Parse a YouTube watch, share, Shorts, embed, or live URL. */
export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const candidate = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const videoId = readVideoId(url)
  if (!videoId || !isYouTubeVideoId(videoId)) return null

  const startSec = readStartSec(url)
  return startSec === undefined ? { videoId } : { videoId, startSec }
}
