import type { ProgressMap } from '../../data/progressRepository'
import type {
  AudioSourceRecord,
  ImportedScenarioRecord,
} from '../audio-import/types'
import type {
  SpeakingAudio,
  SpeakingSession,
} from '../free-talk/types'

export type SnapshotAudioSource = Omit<AudioSourceRecord, 'blob'>
export type SnapshotSpeakingAudio = Omit<SpeakingAudio, 'blob'>

export type DropboxSnapshot = {
  schemaVersion: 2
  exportedAt: number
  progress: ProgressMap
  scenarios: ImportedScenarioRecord[]
  audioSources: SnapshotAudioSource[]
  speakingSessions: SpeakingSession[]
  speakingAudioSources: SnapshotSpeakingAudio[]
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
