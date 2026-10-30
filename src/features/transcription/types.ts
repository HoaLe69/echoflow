export type RawTranscriptSegment = {
  text: string
  startMs: number
  endMs: number
}

export type TranscriptResult = {
  language: string
  segments: RawTranscriptSegment[]
}

export type TranscriptionProviderId =
  | 'local-whisper'
  | 'groq'
  | 'assemblyai'

export const TRANSCRIPTION_PROVIDER_IDS: TranscriptionProviderId[] = [
  'local-whisper',
  'groq',
  'assemblyai',
]

export const DEFAULT_TRANSCRIPTION_PROVIDER_ID: TranscriptionProviderId =
  'local-whisper'

export type TranscriptionOptions = {
  language?: string
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

export interface TranscriptionProvider {
  readonly id: TranscriptionProviderId
  prepare(): Promise<void>
  transcribe(
    file: File,
    options?: TranscriptionOptions,
  ): Promise<TranscriptResult>
  cancel(): Promise<void>
  dispose(): void
}

export type ErrorCode =
  | 'auth'
  | 'rate_limit'
  | 'too_large'
  | 'network'
  | 'unsupported'
  | 'unknown'

export class TranscriptionError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = 'TranscriptionError'
    this.code = code
  }
}
