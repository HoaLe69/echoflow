import { useCallback, useState } from 'react'
import type { Scenario, Turn } from '../../types/scenario'
import { TOTAL_ROUNDS } from './constants'
import { buildDialogueView, firstUserTurnIndex, nextUserTurnIndex } from './turnUtils'
import type { PracticeRole } from './types'

type SessionState = {
  role: PracticeRole
  round: number
  activeTurnIndex: number
  isComplete: boolean
}

function createInitialSession(
  turns: Turn[],
  role: PracticeRole = 0,
): SessionState {
  return {
    role,
    round: 1,
    activeTurnIndex: firstUserTurnIndex(turns, role),
    isComplete: false,
  }
}

export function advanceSession(
  state: SessionState,
  turns: Turn[],
  totalRounds: number,
): SessionState {
  if (state.isComplete) return state

  const nextIndex = nextUserTurnIndex(
    turns,
    state.activeTurnIndex,
    state.role,
  )

  if (nextIndex !== null) {
    return { ...state, activeTurnIndex: nextIndex }
  }

  if (state.round < totalRounds) {
    return {
      ...state,
      round: state.round + 1,
      activeTurnIndex: firstUserTurnIndex(turns, state.role),
    }
  }

  return { ...state, isComplete: true }
}

export function usePracticeSession(
  scenario: Scenario,
  totalRounds = TOTAL_ROUNDS,
) {
  const [state, setState] = useState<SessionState>(() =>
    createInitialSession(scenario.turns),
  )

  const dialogue = buildDialogueView(
    scenario.turns,
    state.activeTurnIndex,
    state.role,
  )
  const otherRole: PracticeRole = state.role === 0 ? 1 : 0

  const changeRole = useCallback(
    (nextRole: PracticeRole) => {
      setState((current) =>
        current.role === nextRole
          ? current
          : createInitialSession(scenario.turns, nextRole),
      )
    },
    [scenario.turns],
  )

  const nextTurn = useCallback(() => {
    setState((current) =>
      advanceSession(current, scenario.turns, totalRounds),
    )
  }, [scenario.turns, totalRounds])

  return {
    ...state,
    ...dialogue,
    userSpeaker: state.role,
    partnerName: `Sam (${scenario.roles[otherRole]})`,
    userRoleLabel: `You (${scenario.roles[state.role]})`,
    turnKey: `${state.round}:${state.role}:${state.activeTurnIndex}:${
      state.isComplete ? 'complete' : 'active'
    }`,
    changeRole,
    nextTurn,
  }
}
