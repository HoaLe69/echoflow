import type { ScoreResult } from '../../lib/score'

export function matchLabel(score: number): string {
  if (score >= 90) return 'Pronunciation Match: Velvety smooth!'
  if (score >= 75) return 'Pronunciation Match: Clear and steady!'
  if (score >= 50) return 'Pronunciation Match: Getting there!'
  return 'Pronunciation Match: Keep going!'
}

export function formatScoreDetail(
  result: ScoreResult,
  targetWordCount: number,
): string {
  const fillers =
    result.hesitationCount > 0
      ? ` · ${result.hesitationCount} filler${
          result.hesitationCount === 1 ? '' : 's'
        }`
      : ''

  return `${result.matchedWords.length} of ${targetWordCount} words matched${fillers}`
}

export function toFeedbackProps(
  result: ScoreResult,
  targetWordCount: number,
) {
  return {
    score: result.score,
    message: matchLabel(result.score),
    detail: formatScoreDetail(result, targetWordCount),
    feedbackMessage: result.feedbackMessage,
  }
}
