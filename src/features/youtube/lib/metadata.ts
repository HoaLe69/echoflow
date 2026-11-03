export type YouTubeMetadata = {
  title: string
  channel: string
}

const OEMBED_ENDPOINT = 'https://www.youtube.com/oembed'
const DEFAULT_TIMEOUT_MS = 6_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Fetch title/channel through YouTube's public oEmbed endpoint. Returns null for
 * CORS, network, timeout, or malformed responses so saving never depends on it.
 */
export async function fetchYouTubeMetadata(
  videoId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<YouTubeMetadata | null> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const endpoint = new URL(OEMBED_ENDPOINT)
    endpoint.searchParams.set(
      'url',
      `https://www.youtube.com/watch?v=${videoId}`,
    )
    endpoint.searchParams.set('format', 'json')

    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) return null

    const data: unknown = await response.json()
    if (!isRecord(data)) return null

    const title = data.title
    const channel = data.author_name
    if (typeof title !== 'string' || !title.trim()) return null
    if (typeof channel !== 'string' || !channel.trim()) return null

    return { title: title.trim(), channel: channel.trim() }
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
