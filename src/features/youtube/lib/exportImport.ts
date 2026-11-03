import {
  getAllNoteRecords,
  getAllVideoRecords,
  mergeYouTubeData,
} from '../db'
import type { MergeYouTubeResult } from '../db'
import type { Note, Video } from '../types'
import { isNoteRecord, isVideoRecord } from './validate'

export type YouTubeBackupFile = {
  schemaVersion: 1
  exportedAt: number
  videos: Video[]
  notes: Note[]
}

export type BackupIssue = {
  collection: 'videos' | 'notes'
  index: number
  message: string
}

export type ParsedYouTubeBackup = {
  backup: YouTubeBackupFile
  issues: BackupIssue[]
}

export type ImportYouTubeResult = MergeYouTubeResult & {
  issues: BackupIssue[]
  totalVideos: number
  totalNotes: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function createYouTubeBackup(): Promise<YouTubeBackupFile> {
  const [videos, notes] = await Promise.all([
    getAllVideoRecords(),
    getAllNoteRecords(),
  ])

  return {
    schemaVersion: 1,
    exportedAt: Date.now(),
    videos,
    notes,
  }
}

/**
 * Validate a parsed JSON value. Invalid individual records are reported and
 * skipped; a wrong schema or missing collections rejects the whole file.
 */
export function parseYouTubeBackup(value: unknown): ParsedYouTubeBackup {
  if (!isRecord(value)) {
    throw new Error('This file does not contain a YouTube backup object.')
  }

  if (value.schemaVersion !== 1) {
    throw new Error(
      'This is not an EchoFlow YouTube backup (schemaVersion 1 required).',
    )
  }

  if (
    !Array.isArray(value.videos) ||
    !Array.isArray(value.notes) ||
    typeof value.exportedAt !== 'number' ||
    !Number.isFinite(value.exportedAt)
  ) {
    throw new Error('This backup is missing videos, notes, or exportedAt.')
  }

  const issues: BackupIssue[] = []
  const videos: Video[] = []
  const notes: Note[] = []

  value.videos.forEach((record, index) => {
    if (isVideoRecord(record)) {
      videos.push(record)
    } else {
      issues.push({
        collection: 'videos',
        index,
        message: `Video record #${index + 1} is invalid.`,
      })
    }
  })

  value.notes.forEach((record, index) => {
    if (isNoteRecord(record)) {
      notes.push(record)
    } else {
      issues.push({
        collection: 'notes',
        index,
        message: `Note record #${index + 1} is invalid.`,
      })
    }
  })

  return {
    backup: {
      schemaVersion: 1,
      exportedAt: value.exportedAt,
      videos,
      notes,
    },
    issues,
  }
}

export async function importYouTubeBackup(
  value: unknown,
): Promise<ImportYouTubeResult> {
  const { backup, issues } = parseYouTubeBackup(value)
  const result = await mergeYouTubeData(backup.videos, backup.notes)

  return {
    ...result,
    issues,
    totalVideos: backup.videos.length,
    totalNotes: backup.notes.length,
  }
}

export function downloadYouTubeBackup(backup: YouTubeBackupFile): void {
  const date = new Date(backup.exportedAt).toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `echoflow-youtube-${date}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
