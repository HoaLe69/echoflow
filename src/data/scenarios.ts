import scenarioData from './scenarios.json'
import type { Scenario } from '../types/scenario'

export const scenarios = scenarioData as Scenario[]

export function getScenarioById(
  id: string | undefined,
): Scenario | undefined {
  if (!id) return undefined
  return scenarios.find((scenario) => scenario.id === id)
}
