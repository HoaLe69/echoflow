import type {
  DraftTurn,
  ImportFormValues,
  ImportedScenarioRecord
} from '../types'

export const MIN_TURN_DURATION_MS = 100

export type DraftTurnPatch = Partial<
  Pick<DraftTurn, 'text' | 'speaker' | 'startMs' | 'endMs'>
>

function alternateSpeaker(speaker: DraftTurn['speaker']): DraftTurn['speaker'] {
  return speaker === 'A' ? 'B' : 'A'
}

function relabelSpeakersFrom(
  turns: DraftTurn[],
  startIndex: number,
): DraftTurn[] {
  const next = [...turns]

  for (let index = Math.max(1, startIndex); index < next.length; index += 1) {
    next[index] = {
      ...next[index],
      speaker: alternateSpeaker(next[index - 1].speaker),
    }
  }

  return next
}

export function updateDraftTurn(
  turns: DraftTurn[],
  id: string,
  patch: DraftTurnPatch,
): DraftTurn[] {
  return turns.map((turn) => {
    if (turn.id !== id) return turn

    const hasTimePatch =
      patch.startMs !== undefined || patch.endMs !== undefined
    if (!hasTimePatch) return { ...turn, ...patch }

    const startMs = patch.startMs ?? turn.startMs
    const endMs = patch.endMs ?? turn.endMs

    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      startMs < 0 ||
      endMs - startMs < MIN_TURN_DURATION_MS
    ) {
      return turn
    }

    return {
      ...turn,
      ...patch,
      startMs: Math.round(startMs),
      endMs: Math.round(endMs),
    }
  })
}

export function mergeDraftTurn(
  turns: DraftTurn[],
  index: number
): DraftTurn[] {
  if (index <= 0 || index >= turns.length) return turns

  const previous = turns[index - 1]
  const current = turns[index]
  const merged: DraftTurn = {
    ...previous,
    startMs: Math.min(previous.startMs, current.startMs),
    endMs: Math.max(previous.endMs, current.endMs),
    text: `${previous.text} ${current.text}`.trim(),
    speaker: previous.speaker,
  }

  const next = [
    ...turns.slice(0, index - 1),
    merged,
    ...turns.slice(index + 1),
  ]

  // Keep the merged turn, then restore alternating labels through the end.
  return relabelSpeakersFrom(next, index)
}

export function splitDraftTurn(
  turns: DraftTurn[],
  index: number,
  charIndex: number,
): DraftTurn[] {
  const turn = turns[index]
  if (!turn) return turns
  if (!Number.isFinite(charIndex)) return turns

  const text = turn.text
  if (charIndex <= 0 || charIndex >= text.length) return turns
  if (turn.endMs - turn.startMs < MIN_TURN_DURATION_MS * 2) return turns

  // Snap to the nearest word boundary so a click inside a word does not
  // produce "hel" / "lo world".
  const safeCharIndex = Math.min(
    text.length - 1,
    Math.max(1, charIndex),
  )
  const boundary =
    /\s/.test(text[safeCharIndex - 1] ?? '') ||
    /\s/.test(text[safeCharIndex] ?? '')
      ? safeCharIndex
      : (() => {
          const previousSpace = text.lastIndexOf(' ', safeCharIndex)
          const nextSpace = text.indexOf(' ', safeCharIndex)
          if (previousSpace < 1) return nextSpace
          if (nextSpace === -1) return previousSpace
          return safeCharIndex - previousSpace <= nextSpace - safeCharIndex
            ? previousSpace
            : nextSpace
        })()

  if (boundary <= 0 || boundary >= text.length) return turns

  const firstText = text.slice(0, boundary).trim()
  const secondText = text.slice(boundary).trim()
  if (!firstText || !secondText) return turns

  const ratio = boundary / text.length
  const estimatedSplitMs =
    turn.startMs + (turn.endMs - turn.startMs) * ratio
  const splitMs = Math.min(
    turn.endMs - MIN_TURN_DURATION_MS,
    Math.max(turn.startMs + MIN_TURN_DURATION_MS, estimatedSplitMs),
  )

  const first: DraftTurn = {
    ...turn,
    text: firstText,
    endMs: Math.round(splitMs),
  }
  const second: DraftTurn = {
    ...turn,
    id: crypto.randomUUID(),
    text: secondText,
    startMs: Math.round(splitMs),
    speaker: alternateSpeaker(turn.speaker),
  }

  const next = [
    ...turns.slice(0, index),
    first,
    second,
    ...turns.slice(index + 1),
  ]

  // The split point starts the opposite speaker; keep the rest alternating.
  return relabelSpeakersFrom(next, index + 1)
}

export function validateDraftTurns(
  turns: DraftTurn[],
  durationMs?: number,
): string | null {
  if (turns.length < 2) return 'At least two turns are required.'
  if (turns.some((turn) => turn.text.trim().length === 0)) {
    return 'Every turn needs transcript text.'
  }

  for (const turn of turns) {
    if (
      !Number.isFinite(turn.startMs) ||
      !Number.isFinite(turn.endMs) ||
      turn.startMs < 0 ||
      turn.endMs - turn.startMs < MIN_TURN_DURATION_MS
    ) {
      return 'Every turn needs a valid start and end time.'
    }

    if (durationMs !== undefined && turn.endMs > durationMs + 1) {
      return 'Turn times must stay within the audio duration.'
    }
  }

  const speakers = new Set(turns.map((turn) => turn.speaker))
  if (speakers.size < 2) {
    return 'Assign at least one turn to each speaker.'
  }

  return null
}

type CreateImportedScenarioArgs = {
  id: string
  sourceId: string
  turns: DraftTurn[]
  form: ImportFormValues
}

export function draftToImportedScenario({
  id,
  sourceId,
  turns,
  form,
}: CreateImportedScenarioArgs): ImportedScenarioRecord {
  return {
    id,
    title: form.title.trim() || 'Imported conversation',
    level: form.level,
    topic: form.topic.trim() || 'Imported',
    goal: form.goal.trim() || undefined,
    roles: [
      form.roleA.trim() || 'Speaker A',
      form.roleB.trim() || 'Speaker B',
    ],
    turns: turns.map((turn) => ({
      speaker: turn.speaker === 'A' ? 0 : 1,
      text: turn.text.trim(),
      audio: {
        sourceId,
        startMs: turn.startMs,
        endMs: turn.endMs,
      },
    })),
    kind: 'imported',
    audioSourceId: sourceId,
    createdAt: Date.now(),
  }
}
