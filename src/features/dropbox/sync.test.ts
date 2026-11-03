import { describe, expect, it } from 'vitest'
import type { Note, Video } from '../youtube/types'
import { parseDropboxSnapshot } from './sync'

const video: Video = {
  id: 'M7lc1UVf-VE',
  title: 'Test video',
  channel: 'Test channel',
  thumbnailUrl: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg',
  lastPositionSec: 12,
  embeddable: true,
  tags: [],
  addedAt: 1,
  lastOpenedAt: 2,
  updatedAt: 3,
}

const note: Note = {
  id: 'note-1',
  videoId: video.id,
  kind: 'word',
  text: 'fallback',
  startSec: 10,
  endSec: 15,
  status: 'new',
  tags: ['test'],
  createdAt: 4,
  updatedAt: 5,
}

const base = {
  exportedAt: 100,
  progress: {},
  scenarios: [],
  audioSources: [],
  speakingSessions: [],
  speakingAudioSources: [],
}

describe('parseDropboxSnapshot', () => {
  it('accepts schema 3 with videos and notes', () => {
    const result = parseDropboxSnapshot({
      ...base,
      schemaVersion: 3,
      videos: [video],
      notes: [note],
    })

    expect(result?.includesYouTubeData).toBe(true)
    expect(result?.snapshot.videos).toEqual([video])
    expect(result?.snapshot.notes).toEqual([note])
  })

  it('keeps schema 2 backups valid without YouTube data', () => {
    const result = parseDropboxSnapshot({ ...base, schemaVersion: 2 })

    expect(result?.includesYouTubeData).toBe(false)
    expect(result?.snapshot.videos).toEqual([])
    expect(result?.snapshot.notes).toEqual([])
  })

  it('rejects schema 3 with invalid records', () => {
    expect(
      parseDropboxSnapshot({
        ...base,
        schemaVersion: 3,
        videos: [video],
        notes: [{ ...note, videoId: 'too-short' }],
      }),
    ).toBeNull()
  })
})
