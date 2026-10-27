import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type {
  AudioSourceRecord,
  ImportedScenarioRecord
} from '../features/audio-import/types'


interface EchoFlowDb extends DBSchema {
  audioSources: {
    key: string,
    value: AudioSourceRecord
  }
  importedScenarios: {
    key: string,
    value: ImportedScenarioRecord,
    indexes: { 'by-createdAt': number }
  }
}

let dbPromise: Promise<IDBPDatabase<EchoFlowDb>> | null = null

export function getAudioDb() {
  if (typeof indexedDB == 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available.'))
  }

  if (!dbPromise) {
    dbPromise = openDB<EchoFlowDb>('echoflow', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('audioSources')) {
          db.createObjectStore('audioSources', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('importedScenarios')) {
          const store = db.createObjectStore('importedScenarios', { keyPath: 'id' })
          store.createIndex('by-createdAt', 'createdAt')
        }
      }
    })
  }
  return dbPromise
}
