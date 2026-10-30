import type { Level } from '../../types/scenario'
import type { TranscriptionProviderId } from '../transcription/types'

export type FreeTalkFocus = 'balanced' | 'grammar' | 'vocabulary'

export type FreeTalkTopic = {
  id: string
  category: string
  prompt: string
  suggestedLevel: Level
}

export type SpeakingScores = {
  grammar: number
  vocabulary: number
  coherence: number
  fluency: number
  overall: number
}

export type SpeakingCorrection = {
  original: string
  corrected: string
  explanation: string
}

export type SpeakingVocabularyUpgrade = {
  original: string
  suggestion: string
  reason: string
}

export type SpeakingReview = {
  summary: string
  correctedTranscript: string
  scores: SpeakingScores
  strengths: string[]
  improvements: string[]
  corrections: SpeakingCorrection[]
  vocabularyUpgrades: SpeakingVocabularyUpgrade[]
  nextStep: string
}

export type SpeakingSession = {
  id: string
  topic: string
  category: string
  level: Level
  focus: FreeTalkFocus
  targetDurationMs: number
  audioDurationMs: number
  audioId: string
  transcript: string
  transcriptProvider: TranscriptionProviderId
  review: SpeakingReview | null
  createdAt: number
}

export type SpeakingAudio = {
  id: string
  blob: Blob
  mimeType: string
  sizeBytes: number
  durationMs: number
  createdAt: number
}

export type FreeTalkReviewInput = {
  transcript: string
  topic: string
  level: Level
  focus: FreeTalkFocus
  durationMs: number
}
