import { getAudioDb } from "./audioDb"

import type { AudioSourceRecord, ImportedScenarioRecord } from "../features/audio-import/types"


export async function getAudioSource(
  id: string
): Promise<AudioSourceRecord | undefined> {
  const db = await getAudioDb()
  return db.get('audioSources', id)
}

export async function saveImportBundle(
  source: AudioSourceRecord,
  scenario: ImportedScenarioRecord
): Promise<void> {
  const db = await getAudioDb()
  const tx = db.transaction(
    ['audioSources', 'importedScenarios'],
    'readwrite'
  )

  await Promise.all([
    tx.objectStore('audioSources').put(source),
    tx.objectStore('importedScenarios').put(scenario),
    tx.done
  ])
}

export async function deleteImportBundle(
  scenarioId: string,
  sourceId: string
): Promise<void> {
  const db = await getAudioDb()
  const tx = db.transaction(
    ['audioSources', 'importedScenarios'],
    'readwrite'
  )


  await Promise.all([
    tx.objectStore('importedScenarios').delete(scenarioId),
    tx.objectStore('audioSources').delete(sourceId),
    tx.done
  ])
}
