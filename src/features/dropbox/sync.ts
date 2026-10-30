import {
  listAllAudioSources,
  replaceImportData,
} from '../../data/audioRepository'
import { listImportedScenarios } from '../../data/importedScenarioRepository'
import { readProgress, writeProgress } from '../../data/progressRepository'
import {
  listAllSpeakingAudio,
  listSpeakingSessions,
  replaceSpeakingData,
} from '../../data/speakingRepository'
import type { AudioSourceRecord } from '../audio-import/types'
import type {
  SpeakingAudio,
  SpeakingSession,
} from '../free-talk/types'
import { downloadDropboxFile, uploadDropboxFile } from './client'
import type {
  DropboxLastSync,
  DropboxSnapshot,
  SnapshotAudioSource,
  SnapshotSpeakingAudio,
  SyncProgress,
} from './types'

const DATA_PATH = '/data.json'
const AUDIO_PATH_PREFIX = '/audio/'
const SPEAKING_AUDIO_PATH_PREFIX = '/speaking-audio/'
const LAST_SYNC_KEY = 'echoflow:dropbox:last-sync:v1'

type ProgressListener = (progress: SyncProgress) => void

type ParsedSnapshot = {
  snapshot: DropboxSnapshot
  includesSpeakingData: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAudioMetadata(value: unknown): value is SnapshotAudioSource {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.sizeBytes === 'number' &&
    typeof value.durationMs === 'number' &&
    typeof value.createdAt === 'number'
  )
}

function isSpeakingAudioMetadata(
  value: unknown,
): value is SnapshotSpeakingAudio {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.sizeBytes === 'number' &&
    typeof value.durationMs === 'number' &&
    typeof value.createdAt === 'number'
  )
}

function parseSnapshot(value: unknown): ParsedSnapshot | null {
  if (!isRecord(value)) return null
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) return null

  if (
    typeof value.exportedAt !== 'number' ||
    !isRecord(value.progress) ||
    !Array.isArray(value.scenarios) ||
    !Array.isArray(value.audioSources) ||
    !value.audioSources.every(isAudioMetadata)
  ) {
    return null
  }

  const includesSpeakingData = value.schemaVersion === 2
  if (
    includesSpeakingData &&
    (!Array.isArray(value.speakingSessions) ||
      !Array.isArray(value.speakingAudioSources) ||
      !value.speakingAudioSources.every(isSpeakingAudioMetadata))
  ) {
    return null
  }

  return {
    includesSpeakingData,
    snapshot: {
      schemaVersion: 2,
      exportedAt: value.exportedAt,
      progress: value.progress as DropboxSnapshot['progress'],
      scenarios: value.scenarios as DropboxSnapshot['scenarios'],
      audioSources: value.audioSources as SnapshotAudioSource[],
      speakingSessions: includesSpeakingData
        ? (value.speakingSessions as SpeakingSession[])
        : [],
      speakingAudioSources: includesSpeakingData
        ? (value.speakingAudioSources as SnapshotSpeakingAudio[])
        : [],
    },
  }
}

export function readLastSync(): DropboxLastSync | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(LAST_SYNC_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DropboxLastSync>
    if (
      typeof parsed.at !== 'number' ||
      (parsed.direction !== 'backup' && parsed.direction !== 'restore')
    ) {
      return null
    }

    return { at: parsed.at, direction: parsed.direction }
  } catch {
    return null
  }
}

function writeLastSync(lastSync: DropboxLastSync): void {
  try {
    window.localStorage.setItem(
      LAST_SYNC_KEY,
      JSON.stringify(lastSync),
    )
  } catch {
    // Storage failure should not fail the sync itself.
  }
}

function audioPath(sourceId: string): string {
  return `${AUDIO_PATH_PREFIX}${sourceId}`
}

function speakingAudioPath(sourceId: string): string {
  return `${SPEAKING_AUDIO_PATH_PREFIX}${sourceId}`
}

async function createLocalSnapshot(): Promise<{
  snapshot: DropboxSnapshot
  sources: AudioSourceRecord[]
  speakingAudio: SpeakingAudio[]
}> {
  const [sources, scenarios, speakingSessions, speakingAudio] =
    await Promise.all([
      listAllAudioSources(),
      listImportedScenarios(),
      listSpeakingSessions(),
      listAllSpeakingAudio(),
    ])

  return {
    snapshot: {
      schemaVersion: 2,
      exportedAt: Date.now(),
      progress: readProgress(),
      scenarios,
      audioSources: sources.map(({ blob: _blob, ...metadata }) => metadata),
      speakingSessions,
      speakingAudioSources: speakingAudio.map(
        ({ blob: _blob, ...metadata }) => metadata,
      ),
    },
    sources,
    speakingAudio,
  }
}

export async function backupToDropbox(
  onProgress?: ProgressListener,
): Promise<DropboxLastSync> {
  const { snapshot, sources, speakingAudio } =
    await createLocalSnapshot()
  const total = sources.length + speakingAudio.length + 1

  for (const [index, source] of sources.entries()) {
    onProgress?.({
      message: `Uploading audio ${index + 1}/${sources.length}`,
      current: index,
      total,
    })

    await uploadDropboxFile(audioPath(source.id), source.blob)
  }

  for (const [index, audio] of speakingAudio.entries()) {
    onProgress?.({
      message: `Uploading free talk audio ${index + 1}/${speakingAudio.length}`,
      current: sources.length + index,
      total,
    })

    await uploadDropboxFile(speakingAudioPath(audio.id), audio.blob)
  }

  onProgress?.({
    message: 'Uploading transcript and review data',
    current: sources.length + speakingAudio.length,
    total,
  })

  await uploadDropboxFile(
    DATA_PATH,
    new Blob([JSON.stringify(snapshot)], {
      type: 'application/json',
    }),
  )

  const lastSync: DropboxLastSync = {
    at: Date.now(),
    direction: 'backup',
  }
  writeLastSync(lastSync)
  onProgress?.({
    message: 'Backup complete',
    current: total,
    total,
  })

  return lastSync
}

export async function restoreFromDropbox(
  onProgress?: ProgressListener,
): Promise<DropboxLastSync> {
  const dataBlob = await downloadDropboxFile(DATA_PATH)
  if (!dataBlob) {
    throw new Error('No Dropbox backup found for EchoFlow yet.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await dataBlob.text())
  } catch {
    throw new Error('The Dropbox backup data is not valid JSON.')
  }

  const result = parseSnapshot(parsed)
  if (!result) {
    throw new Error('The Dropbox backup uses an unsupported format.')
  }

  const { snapshot, includesSpeakingData } = result
  const total =
    snapshot.audioSources.length +
    snapshot.speakingAudioSources.length +
    1
  const sources: AudioSourceRecord[] = []
  const speakingAudio: SpeakingAudio[] = []

  for (const [index, metadata] of snapshot.audioSources.entries()) {
    onProgress?.({
      message: `Downloading audio ${index + 1}/${snapshot.audioSources.length}`,
      current: index,
      total,
    })

    const downloaded = await downloadDropboxFile(audioPath(metadata.id))
    if (!downloaded) {
      throw new Error(
        `The Dropbox backup is missing audio for "${metadata.fileName}".`,
      )
    }

    const blob =
      downloaded.type === metadata.mimeType
        ? downloaded
        : new Blob([downloaded], {
            type:
              metadata.mimeType ||
              downloaded.type ||
              'application/octet-stream',
          })

    sources.push({ ...metadata, blob })
  }

  for (const [index, metadata] of snapshot.speakingAudioSources.entries()) {
    onProgress?.({
      message: `Downloading free talk audio ${index + 1}/${snapshot.speakingAudioSources.length}`,
      current: snapshot.audioSources.length + index,
      total,
    })

    const downloaded = await downloadDropboxFile(
      speakingAudioPath(metadata.id),
    )
    if (!downloaded) {
      throw new Error('The Dropbox backup is missing free talk audio.')
    }

    const blob =
      downloaded.type === metadata.mimeType
        ? downloaded
        : new Blob([downloaded], {
            type:
              metadata.mimeType ||
              downloaded.type ||
              'application/octet-stream',
          })

    speakingAudio.push({ ...metadata, blob })
  }

  onProgress?.({
    message: 'Restoring local library',
    current: total - 1,
    total,
  })

  await replaceImportData(sources, snapshot.scenarios)
  if (includesSpeakingData) {
    await replaceSpeakingData(snapshot.speakingSessions, speakingAudio)
  }
  writeProgress(snapshot.progress)

  const lastSync: DropboxLastSync = {
    at: Date.now(),
    direction: 'restore',
  }
  writeLastSync(lastSync)
  onProgress?.({
    message: 'Restore complete',
    current: total,
    total,
  })

  return lastSync
}
