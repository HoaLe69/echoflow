import createModule from "@transcribe/shout";
import { FileTranscriber } from "@transcribe/transcriber";

import type {
  TranscriptionProvider,
  TranscriptResult
} from './types'


export const WHISPER_MODEL_PATH = '/models/ggml-base.en-q5_1.bin'


export function createTranscribeJsProvider(
  onProgress: (progress: number) => void
): TranscriptionProvider {
  let transcriber: FileTranscriber | null = null
  let initPromise: Promise<void> | null = null

  async function ensureTranscriber(): Promise<FileTranscriber> {
    if (!transcriber) {
      const instance = new FileTranscriber({
        createModule,
        model: WHISPER_MODEL_PATH,
        onProgress
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
    async prepare() {
      await ensureTranscriber()
    },
    async transcribe(file: File): Promise<TranscriptResult> {
      const instance = await ensureTranscriber()
      const result = await instance.transcribe(file, {
        lang: 'en',
        max_len: 160,
        split_on_word: true,
        suppress_non_speech: true
      })

      return {
        language: result.result.language,
        segments: result.transcription
          .map(segment => ({
            text: segment.text.trim(),
            startMs: segment.offsets.from,
            endMs: segment.offsets.to
          }))
          .filter(segment => segment.text.length > 0 && segment.endMs > segment.startMs),
      }
    },
    async cancel() {
      await transcriber?.cancel()
    },
    dispose() {
      transcriber?.destroy()
      transcriber = null
      initPromise = null
    }
  }
}





