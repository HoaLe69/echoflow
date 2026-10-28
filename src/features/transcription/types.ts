export type RawTranscriptSegment = {
  text: string
  startMs: number
  endMs: number
}


export type TranscriptResult = {
  language: string
  segments: RawTranscriptSegment[]
}

export interface TranscriptionProvider {
  prepare(): Promise<void>
  transcribe(file: File): Promise<TranscriptResult>
  cancel(): Promise<void>
  dispose(): void
}
