import type { Turn } from '../../types/scenario'

export type UpcomingTurnItem = {
  turn: Turn
  index: number
}

export type DialogueView = {
  userTurn: Turn
  partnerTurn: Turn | null
  upcomingTurns: UpcomingTurnItem[]
  step: number
  totalSteps: number
}

export function firstUserTurnIndex(
  turns: Turn[],
  userSpeaker: 0 | 1,
): number {
  const index = turns.findIndex((turn) => turn.speaker === userSpeaker)
  return index === -1 ? 0 : index
}

export function nextUserTurnIndex(
  turns: Turn[],
  fromIndex: number,
  userSpeaker: 0 | 1,
): number | null {
  for (let index = fromIndex + 1; index < turns.length; index += 1) {
    if (turns[index].speaker === userSpeaker) return index
  }
  return null
}

export function previousPartnerTurn(
  turns: Turn[],
  activeIndex: number,
  userSpeaker: 0 | 1,
): Turn | null {
  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    if (turns[index].speaker !== userSpeaker) return turns[index]
  }
  return null
}

export function buildDialogueView(
  turns: Turn[],
  activeIndex: number,
  userSpeaker: 0 | 1,
): DialogueView {
  const userTurn =
    turns[activeIndex] ?? turns[firstUserTurnIndex(turns, userSpeaker)]

  if (!userTurn) {
    throw new Error('Practice scenario must contain at least one turn.')
  }

  return {
    userTurn,
    partnerTurn: previousPartnerTurn(turns, activeIndex, userSpeaker),
    upcomingTurns: turns
      .map((turn, index) => ({ turn, index }))
      .slice(activeIndex + 1, activeIndex + 3),
    step: activeIndex + 1,
    totalSteps: turns.length,
  }
}
