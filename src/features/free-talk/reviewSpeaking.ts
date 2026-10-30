import { apiFetch } from '../transcription/lib/apiFetch'
import type {
  FreeTalkReviewInput,
  SpeakingReview,
} from './types'

type ReviewResponse = SpeakingReview & {
  meta?: {
    model?: string
    durationMs?: number
  }
}

export async function reviewSpeaking(
  input: FreeTalkReviewInput,
): Promise<SpeakingReview> {
  return apiFetch<ReviewResponse>('/api/review/speaking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
