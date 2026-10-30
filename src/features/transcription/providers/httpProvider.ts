import { apiFetch } from '../lib/apiFetch'
import type {
  TranscriptionOptions,
  TranscriptionProvider,
  TranscriptionProviderId,
  TranscriptResult,
} from '../types'

export type RemoteProviderId = Exclude<
  TranscriptionProviderId,
  'local-whisper'
>

export function createHttpProvider(
  id: RemoteProviderId,
  endpoint: string,
): TranscriptionProvider {
  let controller: AbortController | null = null

  return {
    id,

    async prepare() {
      // The backend is stateless; nothing to load client-side.
    },

    async transcribe(
      file: File,
      options: TranscriptionOptions = {},
    ): Promise<TranscriptResult> {
      controller = new AbortController()

      const onAbort = () => controller?.abort()
      options.signal?.addEventListener('abort', onAbort, { once: true })

      const body = new FormData()
      body.append('file', file, file.name)
      body.append('language', options.language ?? 'en')

      try {
        const result = await apiFetch<TranscriptResult>(endpoint, {
          method: 'POST',
          body,
          signal: controller.signal,
        })

        options.onProgress?.(100)
        return result
      } finally {
        options.signal?.removeEventListener('abort', onAbort)
        controller = null
      }
    },

    async cancel() {
      controller?.abort()
    },

    dispose() {
      controller?.abort()
      controller = null
    },
  }
}
