import { getAudioDb } from './audioDb'
import type { ImportedScenarioRecord } from '../features/audio-import/types'

export async function listImportedScenarios(): Promise<
  ImportedScenarioRecord[]
> {
  const db = await getAudioDb()
  const records = await db.getAllFromIndex('importedScenarios', 'by-createdAt')
  return records.sort((a, b) => b.createdAt - a.createdAt)
}


export async function getImportedScenario(
  id: string
): Promise<ImportedScenarioRecord | undefined> {
  const db = await getAudioDb()
  return db.get('importedScenarios', id)
}
