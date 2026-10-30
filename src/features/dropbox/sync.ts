import {
  listAllAudioSources,
  replaceImportData,
} from '../../data/audioRepository'
import { listImportedScenarios } from '../../data/importedScenarioRepository'
import { readProgress, writeProgress } from '../../data/progressRepository'
import type { AudioSourceRecord } from '../audio-import/types'
import { downloadDropboxFile, uploadDropboxFile } from './client'
import type {
  DropboxLastSync,
  DropboxSnapshot,
  SnapshotAudioSource,
  SyncProgress,
} from './types'

const DATA_PATH = '/data.json'
const AUDIO_PATH_PREFIX = '/audio/'
const LAST_SYNC_KEY = 'echoflow:dropbox:last-sync:v1'

type ProgressListener = (progress: SyncProgress) => void

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

function isSnapshot(value: unknown): value is DropboxSnapshot {
  if (!isRecord(value)) return false

  return (
    value.schemaVersion === 1 &&
    typeof value.exportedAt === 'number' &&
    isRecord(value.progress) &&
    Array.isArray(value.scenarios) &&
    Array.isArray(value.audioSources) &&
    value.audioSources.every(isAudioMetadata)
  )
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

async function createLocalSnapshot(): Promise<{
  snapshot: DropboxSnapshot
  sources: AudioSourceRecord[]
}> {
  const [sources, scenarios] = await Promise.all([
    listAllAudioSources(),
    listImportedScenarios(),
  ])

  return {
    snapshot: {
      schemaVersion: 1,
      exportedAt: Date.now(),
      progress: readProgress(),
      scenarios,
      audioSources: sources.map(({ blob: _blob, ...metadata }) => metadata),
    },
    sources,
  }
}

export async function backupToDropbox(
  onProgress?: ProgressListener,
): Promise<DropboxLastSync> {
  const { snapshot, sources } = await createLocalSnapshot()
  const total = sources.length + 1

  for (const [index, source] of sources.entries()) {
    onProgress?.({
      message: `Uploading audio ${index + 1}/${sources.length}`,
      current: index,
      total,
    })

    await uploadDropboxFile(audioPath(source.id), source.blob)
  }

  onProgress?.({
    message: 'Uploading transcript data',
    current: sources.length,
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

  if (!isSnapshot(parsed)) {
    throw new Error('The Dropbox backup uses an unsupported format.')
  }

  const snapshot = parsed
  const total = snapshot.audioSources.length + 1
  const sources: AudioSourceRecord[] = []

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

  onProgress?.({
    message: 'Restoring local library',
    current: snapshot.audioSources.length,
    total,
  })

  await replaceImportData(sources, snapshot.scenarios)
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
