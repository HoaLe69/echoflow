import createModule from '@transcribe/shout'
import { FileTranscriber } from '@transcribe/transcriber'
import type {
  TranscriptionOptions,
  TranscriptionProvider,
  TranscriptResult,
} from '../types'

export const WHISPER_MODEL_PATH = '/models/ggml-base.en-q5_1.bin'

export function createLocalWhisperProvider(): TranscriptionProvider {
  let transcriber: FileTranscriber | null = null
  let initPromise: Promise<void> | null = null
  let progressListener: ((progress: number) => void) | undefined

  async function ensureTranscriber(): Promise<FileTranscriber> {
    if (!transcriber) {
      const instance = new FileTranscriber({
        createModule,
        model: WHISPER_MODEL_PATH,
        onProgress: (progress) => progressListener?.(progress),
      })
      transcriber = instance
      initPromise = instance.init()
    }

    try {
      await initPromise
    } catch (error) {
      transcriber?.destroy()
      transcriber = null
      initPromise = null
      throw error
    }

    if (!transcriber) {
      throw new Error('Whisper transcriber failed to initialize.')
    }

    return transcriber
  }

  return {
    id: 'local-whisper',

    async prepare() {
      await ensureTranscriber()
    },

    async transcribe(
      file: File,
      options: TranscriptionOptions = {},
    ): Promise<TranscriptResult> {
      if (options.signal?.aborted) {
        throw new DOMException('Transcription was cancelled.', 'AbortError')
      }

      const instance = await ensureTranscriber()
      progressListener = options.onProgress

      try {
        const result = await instance.transcribe(file, {
          lang: options.language ?? 'en',
          max_len: 160,
          split_on_word: true,
          suppress_non_speech: true,
        })

        return {
          language: result.result.language,
          segments: result.transcription
            .map((segment) => ({
              text: segment.text.trim(),
              startMs: segment.offsets.from,
              endMs: segment.offsets.to,
            }))
            .filter(
              (segment) =>
                segment.text.length > 0 && segment.endMs > segment.startMs,
            ),
        }
      } finally {
        progressListener = undefined
      }
    },

    async cancel() {
      await transcriber?.cancel()
    },

    dispose() {
      transcriber?.destroy()
      transcriber = null
      initPromise = null
      progressListener = undefined
    },
  }
}
