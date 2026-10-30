import type { ProgressMap } from '../../data/progressRepository'
import type {
  AudioSourceRecord,
  ImportedScenarioRecord,
} from '../audio-import/types'

export type SnapshotAudioSource = Omit<AudioSourceRecord, 'blob'>

export type DropboxSnapshot = {
  schemaVersion: 1
  exportedAt: number
  progress: ProgressMap
  scenarios: ImportedScenarioRecord[]
  audioSources: SnapshotAudioSource[]
}

export type DropboxAccount = {
  name: string
  email: string
}

export type DropboxLastSync = {
  at: number
  direction: 'backup' | 'restore'
}

export type DropboxAuth = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  account?: DropboxAccount
}

export type SyncProgress = {
  message: string
  current: number
  total: number
}
