import { useEffect, useState } from 'react'
import { findScenarioById } from '../data/scenarioRepository'
import type { Scenario } from '../types/scenario'

type ScenarioLoadState = {
  id: string
  scenario?: Scenario
  error: string | null
}

export function useScenarioById(id: string | undefined) {
  const [state, setState] = useState<ScenarioLoadState | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true

    findScenarioById(id)
      .then((found) => {
        if (!active) return
        setState({
          id,
          scenario: found,
          error: found ? null : 'Scenario not found.',
        })
      })
      .catch((loadError) => {
        if (!active) return
        setState({
          id,
          scenario: undefined,
          error:
            loadError instanceof Error
              ? loadError.message
              : 'Could not load this scenario.',
        })
      })

    return () => {
      active = false
    }
  }, [id])

  const isCurrent = Boolean(id) && state?.id === id

  return {
    scenario: isCurrent ? state?.scenario : undefined,
    isLoading: Boolean(id) && !isCurrent,
    error: isCurrent ? (state?.error ?? null) : null,
  }
}
