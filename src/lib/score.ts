export type ScoreSegment = {
  text: string
  status: 'matched' | 'missed' | 'extra'
}

export type ScoreOptions = {
  /** Hesitation count from the recognition layer; otherwise detected here. */
  hesitationCount?: number
}

export type ScoreResult = {
  /** Combined precision/recall match, 0–100. */
  score: number
  matchedWords: string[]
  missedWords: string[]
  hesitationCount: number
  /** Short line for FeedbackBox's message chip. */
  feedbackMessage: string
  /** Word-level alignment. Target words are matched/missed; extras come from speech. */
  segments: ScoreSegment[]
}

const FILLERS = new Set([
  'um',
  'umm',
  'uh',
  'uhh',
  'er',
  'erm',
  'ah',
  'hmm',
])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  const normalized = normalize(text)
  return normalized ? normalized.split(' ') : []
}

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100)
}

/**
 * Levenshtein alignment with backtracking. Records target segments in order and
 * marks extra spoken words as "extra".
 */
function alignWords(
  target: string[],
  spoken: string[],
): { segments: ScoreSegment[]; matched: number } {
  const rows = target.length
  const cols = spoken.length
  const dp: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0),
  )

  for (let row = 0; row <= rows; row += 1) dp[row][0] = row
  for (let col = 0; col <= cols; col += 1) dp[0][col] = col

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      const substitutionCost =
        target[row - 1] === spoken[col - 1] ? 0 : 1

      dp[row][col] = Math.min(
        dp[row - 1][col - 1] + substitutionCost,
        dp[row - 1][col] + 1,
        dp[row][col - 1] + 1,
      )
    }
  }

  let row = rows
  let col = cols
  let matched = 0
  const reversed: ScoreSegment[] = []

  while (row > 0 || col > 0) {
    if (row > 0 && col > 0 && target[row - 1] === spoken[col - 1]) {
      reversed.push({ text: target[row - 1], status: 'matched' })
      matched += 1
      row -= 1
      col -= 1
    } else if (
      row > 0 &&
      col > 0 &&
      dp[row][col] === dp[row - 1][col - 1] + 1
    ) {
      reversed.push({ text: target[row - 1], status: 'missed' })
      row -= 1
      col -= 1
    } else if (row > 0 && dp[row][col] === dp[row - 1][col] + 1) {
      reversed.push({ text: target[row - 1], status: 'missed' })
      row -= 1
    } else if (col > 0) {
      reversed.push({ text: spoken[col - 1], status: 'extra' })
      col -= 1
    } else {
      break
    }
  }

  return { segments: reversed.reverse(), matched }
}

function buildFeedback(score: number, hesitationCount: number): string {
  if (score >= 90) {
    return hesitationCount > 0
      ? 'Velvety smooth — just trim the fillers.'
      : 'Velvety smooth — native-like rhythm.'
  }
  if (score >= 75) {
    return 'Clear and natural — keep that cadence.'
  }
  if (score >= 50) {
    return 'Getting there — tighten the missed words.'
  }
  if (score > 0) {
    return 'Slow down, mirror the reference, and try again.'
  }
  return 'No match yet — listen once more, then speak.'
}

export function scorePronunciation(
  targetText: string,
  spokenTranscript: string,
  options: ScoreOptions = {},
): ScoreResult {
  const target = tokenize(targetText)
  const spoken = tokenize(spokenTranscript)

  if (target.length === 0) {
    return {
      score: 0,
      matchedWords: [],
      missedWords: [],
      hesitationCount: 0,
      feedbackMessage: 'Nothing to score yet.',
      segments: [],
    }
  }

  const { segments, matched } = alignWords(target, spoken)
  const matchedWords = segments
    .filter((segment) => segment.status === 'matched')
    .map((segment) => segment.text)
  const missedWords = segments
    .filter((segment) => segment.status === 'missed')
    .map((segment) => segment.text)

  // F1 balances missed target words against extra/filler words.
  const recall = matched / target.length
  const precision = spoken.length > 0 ? matched / spoken.length : 0
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0
  const score = clampScore(f1 * 100)

  const detectedHesitations = spoken.filter((word) =>
    FILLERS.has(word),
  ).length
  const hesitationCount =
    options.hesitationCount !== undefined &&
      Number.isFinite(options.hesitationCount)
      ? Math.max(0, Math.round(options.hesitationCount))
      : detectedHesitations

  return {
    score,
    matchedWords,
    missedWords,
    hesitationCount,
    feedbackMessage: buildFeedback(score, hesitationCount),
    segments,
  }
}
