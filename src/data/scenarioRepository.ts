import {
  getImportedScenario,
  listImportedScenarios,
} from './importedScenarioRepository'
import type { Scenario } from '../types/scenario'

export async function listAllScenarios(): Promise<Scenario[]> {
  return listImportedScenarios()
}

export async function findScenarioById(
  id: string,
): Promise<Scenario | undefined> {
  return getImportedScenario(id)
}
