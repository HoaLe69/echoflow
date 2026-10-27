import { scenarios as curated } from './scenarios'
import {
  getImportedScenario,
  listImportedScenarios,
} from './importedScenarioRepository'
import type { Scenario } from '../types/scenario'

export async function listAllScenarios(): Promise<Scenario[]> {
  try {
    const imported = await listImportedScenarios()
    return [...curated, ...imported]
  } catch {
    return curated
  }
}

export async function findScenarioById(
  id: string,
): Promise<Scenario | undefined> {
  const curatedMatch = curated.find((scenario) => scenario.id === id)
  if (curatedMatch) return curatedMatch

  try {
    return await getImportedScenario(id)
  } catch {
    return undefined
  }
}
