import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type {
  AudioSourceRecord,
  ImportedScenarioRecord
} from '../features/audio-import/types'
import type {
  SpeakingAudio,
  SpeakingSession,
} from '../features/free-talk/types'


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
  speakingSessions: {
    key: string,
    value: SpeakingSession,
    indexes: { 'by-createdAt': number }
  }
  speakingAudio: {
    key: string,
    value: SpeakingAudio
  }
}

let dbPromise: Promise<IDBPDatabase<EchoFlowDb>> | null = null

export function getAudioDb() {
  if (typeof indexedDB == 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available.'))
  }

  if (!dbPromise) {
    dbPromise = openDB<EchoFlowDb>('echoflow', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('audioSources')) {
          db.createObjectStore('audioSources', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('importedScenarios')) {
          const store = db.createObjectStore('importedScenarios', { keyPath: 'id' })
          store.createIndex('by-createdAt', 'createdAt')
        }

        if (!db.objectStoreNames.contains('speakingSessions')) {
          const store = db.createObjectStore('speakingSessions', {
            keyPath: 'id',
          })
          store.createIndex('by-createdAt', 'createdAt')
        }

        if (!db.objectStoreNames.contains('speakingAudio')) {
          db.createObjectStore('speakingAudio', { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}
