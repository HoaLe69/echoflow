import { useCallback, useEffect, useRef, useState } from 'react'
import { scenarios as curated } from '../data/scenarios'
import { listAllScenarios } from '../data/scenarioRepository'
import type { Scenario } from '../types/scenario'

export function useScenarioCatalog() {
  const [scenarios, setScenarios] = useState<Scenario[]>(curated)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current

    try {
      const all = await listAllScenarios()
      if (currentRequest !== requestId.current) return
      setScenarios(all)
      setError(null)
    } catch (loadError) {
      if (currentRequest !== requestId.current) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load imported scenarios.',
      )
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial/hydration fetch is the external system this effect synchronizes.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  return { scenarios, isLoading, error, reload }
}
