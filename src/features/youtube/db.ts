import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Note, NoteStatus, Video } from './types'

const DB_NAME = 'echoflow-youtube'
const DB_VERSION = 1

interface YouTubeDb extends DBSchema {
  videos: {
    key: string
    value: Video
    indexes: { 'by-lastOpenedAt': number }
  }
  notes: {
    key: string
    value: Note
    indexes: {
      'by-videoId': string
      'by-status': NoteStatus
      'by-createdAt': number
    }
  }
}

export type AddVideoResult = {
  video: Video
  created: boolean
}

export type VideoPatch = Partial<
  Pick<
    Video,
    | 'title'
    | 'channel'
    | 'thumbnailUrl'
    | 'durationSec'
    | 'lastPositionSec'
    | 'embeddable'
    | 'tags'
    | 'lastOpenedAt'
  >
>

export type NotePatch = Partial<
  Pick<
    Note,
    | 'kind'
    | 'text'
    | 'meaning'
    | 'context'
    | 'startSec'
    | 'endSec'
    | 'status'
    | 'tags'
  >
>

export type NoteFilter = {
  videoId?: string
  /** Case-insensitive match over text, meaning, and context. */
  search?: string
  status?: NoteStatus
  tag?: string
}

let dbPromise: Promise<IDBPDatabase<YouTubeDb>> | null = null

export function getYouTubeDb(): Promise<IDBPDatabase<YouTubeDb>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available.'))
  }

  if (!dbPromise) {
    dbPromise = openDB<YouTubeDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('videos')) {
          const videos = db.createObjectStore('videos', { keyPath: 'id' })
          videos.createIndex('by-lastOpenedAt', 'lastOpenedAt')
        }

        if (!db.objectStoreNames.contains('notes')) {
          const notes = db.createObjectStore('notes', { keyPath: 'id' })
          notes.createIndex('by-videoId', 'videoId')
          notes.createIndex('by-status', 'status')
          notes.createIndex('by-createdAt', 'createdAt')
        }
      },
    })
  }

  return dbPromise
}

/** Close and delete the feature database. Used by tests and a future reset UI. */
export async function deleteYouTubeDb(): Promise<void> {
  const pending = dbPromise
  dbPromise = null

  if (pending) {
    const db = await pending
    db.close()
  }

  if (typeof indexedDB === 'undefined') return

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () =>
      reject(request.error ?? new Error('Could not delete the YouTube database.'))
  })
}

export async function getVideo(id: string): Promise<Video | undefined> {
  const db = await getYouTubeDb()
  return db.get('videos', id)
}

/** Active videos, most recently opened first. */
export async function listVideos(): Promise<Video[]> {
  const db = await getYouTubeDb()
  const videos = await db.getAllFromIndex('videos', 'by-lastOpenedAt')
  return videos.filter((video) => !video.deletedAt).reverse()
}

/**
 * Insert a video, or return the existing active row for a duplicate ID.
 * Re-adding a soft-deleted video revives it and keeps its original addedAt.
 */
export async function addVideo(video: Video): Promise<AddVideoResult> {
  const db = await getYouTubeDb()
  const tx = db.transaction('videos', 'readwrite')
  const existing = await tx.store.get(video.id)

  if (existing && !existing.deletedAt) {
    await tx.done
    return { video: existing, created: false }
  }

  const next: Video = existing
    ? {
        ...existing,
        ...video,
        addedAt: existing.addedAt,
        deletedAt: undefined,
      }
    : video

  await tx.store.put(next)
  await tx.done
  return { video: next, created: true }
}

export async function updateVideo(
  id: string,
  patch: VideoPatch,
  now = Date.now(),
): Promise<Video | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('videos', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing || existing.deletedAt) {
    await tx.done
    return undefined
  }

  const next: Video = { ...existing, ...patch, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

/** Mark a video as opened now. */
export async function touchVideo(
  id: string,
  now = Date.now(),
): Promise<Video | undefined> {
  return updateVideo(id, { lastOpenedAt: now }, now)
}

export async function softDeleteVideo(
  id: string,
  now = Date.now(),
): Promise<Video | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('videos', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing || existing.deletedAt) {
    await tx.done
    return undefined
  }

  const next: Video = { ...existing, deletedAt: now, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

export async function restoreVideo(
  id: string,
  now = Date.now(),
): Promise<Video | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('videos', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing) {
    await tx.done
    return undefined
  }

  if (!existing.deletedAt) {
    await tx.done
    return existing
  }

  const next: Video = { ...existing, deletedAt: undefined, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = await getYouTubeDb()
  return db.get('notes', id)
}

export async function addNote(note: Note): Promise<void> {
  const db = await getYouTubeDb()
  await db.put('notes', note)
}

export async function updateNote(
  id: string,
  patch: NotePatch,
  now = Date.now(),
): Promise<Note | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('notes', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing || existing.deletedAt) {
    await tx.done
    return undefined
  }

  const next: Note = { ...existing, ...patch, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

export async function softDeleteNote(
  id: string,
  now = Date.now(),
): Promise<Note | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('notes', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing || existing.deletedAt) {
    await tx.done
    return undefined
  }

  const next: Note = { ...existing, deletedAt: now, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

export async function restoreNote(
  id: string,
  now = Date.now(),
): Promise<Note | undefined> {
  const db = await getYouTubeDb()
  const tx = db.transaction('notes', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing) {
    await tx.done
    return undefined
  }

  if (!existing.deletedAt) {
    await tx.done
    return existing
  }

  const next: Note = { ...existing, deletedAt: undefined, updatedAt: now }
  await tx.store.put(next)
  await tx.done
  return next
}

/** Active notes for one video, in playback order. */
export async function listNotesForVideo(videoId: string): Promise<Note[]> {
  const db = await getYouTubeDb()
  const notes = await db.getAllFromIndex('notes', 'by-videoId', videoId)

  return notes
    .filter((note) => !note.deletedAt)
    .sort((a, b) => a.startSec - b.startSec || a.createdAt - b.createdAt)
}

/** Active notes, newest first. Notes of deleted videos are hidden too. */
export async function listNotes(filter: NoteFilter = {}): Promise<Note[]> {
  const db = await getYouTubeDb()
  const videos = await db.getAll('videos')
  const deletedVideoIds = new Set(
    videos.filter((video) => video.deletedAt).map((video) => video.id),
  )

  const notes = filter.videoId
    ? await db.getAllFromIndex('notes', 'by-videoId', filter.videoId)
    : await db.getAllFromIndex('notes', 'by-createdAt')

  const needle = filter.search?.trim().toLowerCase() ?? ''
  const tag = filter.tag?.trim().toLowerCase() ?? ''

  return notes
    .filter((note) => !note.deletedAt && !deletedVideoIds.has(note.videoId))
    .filter((note) => !filter.status || note.status === filter.status)
    .filter(
      (note) =>
        !tag || note.tags.some((value) => value.toLowerCase() === tag),
    )
    .filter((note) => {
      if (!needle) return true

      return [note.text, note.meaning ?? '', note.context ?? '']
        .join('\n')
        .toLowerCase()
        .includes(needle)
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Active note counts keyed by video ID. */
export async function countNotesByVideo(): Promise<Record<string, number>> {
  const db = await getYouTubeDb()
  const [videos, notes] = await Promise.all([
    db.getAll('videos'),
    db.getAll('notes'),
  ])
  const activeVideoIds = new Set(
    videos.filter((video) => !video.deletedAt).map((video) => video.id),
  )
  const counts: Record<string, number> = {}

  for (const note of notes) {
    if (note.deletedAt || !activeVideoIds.has(note.videoId)) continue
    counts[note.videoId] = (counts[note.videoId] ?? 0) + 1
  }

  return counts
}

/** Every video row, including soft-deleted ones, for backups. */
export async function getAllVideoRecords(): Promise<Video[]> {
  const db = await getYouTubeDb()
  return db.getAll('videos')
}

/** Every note row, including soft-deleted ones, for backups. */
export async function getAllNoteRecords(): Promise<Note[]> {
  const db = await getYouTubeDb()
  return db.getAll('notes')
}

/** Replace the whole notebook. Used by Dropbox restore. */
export async function replaceYouTubeData(
  videos: Video[],
  notes: Note[],
): Promise<void> {
  const db = await getYouTubeDb()
  const tx = db.transaction(['videos', 'notes'], 'readwrite')
  const videoStore = tx.objectStore('videos')
  const noteStore = tx.objectStore('notes')

  videoStore.clear()
  noteStore.clear()

  for (const video of videos) videoStore.put(video)
  for (const note of notes) noteStore.put(note)

  await tx.done
}

export type MergeYouTubeResult = {
  videosImported: number
  notesImported: number
  videosSkipped: number
  notesSkipped: number
}

/** Merge by ID, keeping the row with the newer updatedAt. */
export async function mergeYouTubeData(
  videos: Video[],
  notes: Note[],
): Promise<MergeYouTubeResult> {
  const db = await getYouTubeDb()
  const tx = db.transaction(['videos', 'notes'], 'readwrite')
  const videoStore = tx.objectStore('videos')
  const noteStore = tx.objectStore('notes')
  const result: MergeYouTubeResult = {
    videosImported: 0,
    notesImported: 0,
    videosSkipped: 0,
    notesSkipped: 0,
  }

  for (const video of videos) {
    const existing = await videoStore.get(video.id)
    if (existing && existing.updatedAt >= video.updatedAt) {
      result.videosSkipped += 1
      continue
    }

    await videoStore.put(video)
    result.videosImported += 1
  }

  for (const note of notes) {
    const existing = await noteStore.get(note.id)
    if (existing && existing.updatedAt >= note.updatedAt) {
      result.notesSkipped += 1
      continue
    }

    await noteStore.put(note)
    result.notesImported += 1
  }

  await tx.done
  return result
}
