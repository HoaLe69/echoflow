import type { Level, Scenario } from '../../types/scenario'

export type SpeakerLabel = 'A' | 'B'

export type DraftTurn = {
  id: string
  startMs: number
  endMs: number
  text: string
  speaker: SpeakerLabel
}


export type ImportStep = 'upload' | 'transcribe' | 'review'

export type ImportFormValues = {
  title: string
  level: Level
  topic: string
  goal: string
  roleA: string
  roleB: string
}

export type AudioSourceRecord = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  durationMs: number
  blob: Blob,
  createdAt: number
}

export type ImportedScenarioRecord = Scenario & {
  kind: 'imported'
  audioSourceId: string
  createdAt: number
}

