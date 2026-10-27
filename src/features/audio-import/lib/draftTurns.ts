import type {
  DraftTurn,
  ImportFormValues,
  ImportedScenarioRecord
} from '../types'

export function updateDraftTurn(
  turns: DraftTurn[],
  id: string,
  patch: Partial<Pick<DraftTurn, 'text' | 'speaker'>>,
): DraftTurn[] {
  return turns.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn))
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
    text: `${previous.text} ${current.text}`.trim()
  }

  return [
    ...turns.slice(0, index - 1),
    merged,
    ...turns.slice(index + 1)
  ]
}

export function splitDraftTurn(
  turns: DraftTurn[],
  index: number
): DraftTurn[] {
  const turn = turns[index]
  if (!turn) return turns

  const words = turn.text.trim().split(/\s+/)
  if (words.length < 4) return turns

  const half = Math.floor(words.length / 2)
  const middleMs = Math.round((turn.startMs + turn.endMs) / 2)

  const first: DraftTurn = {
    ...turn,
    id: crypto.randomUUID(),
    text: words.slice(0, half).join(''),
    endMs: middleMs
  }
  const second: DraftTurn = {
    ...turn,
    id: crypto.randomUUID(),
    text: words.slice(half).join(' '),
    startMs: middleMs
  }

  return [...turns.slice(0, index), first, second, ...turns.slice(index + 1)]
}

export function validateDraftTurns(turns: DraftTurn[]): string | null {
  if (turns.length < 2) return 'At least two turns are required.'
  if (turns.some((turn) => turn.text.trim().length === 0)) {
    return 'Every turn needs transcript text.'
  }

  const speakers = new Set(turns.map((turn) => turn.speaker))
  if (speakers.size < 2) {
    return 'Assign at least one turn to speaker.'
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

