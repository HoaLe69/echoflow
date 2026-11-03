import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addNote,
  addVideo,
  countNotesByVideo,
  deleteYouTubeDb,
  getNote,
  getVideo,
  listNotes,
  listNotesForVideo,
  listVideos,
  restoreNote,
  restoreVideo,
  softDeleteNote,
  softDeleteVideo,
  touchVideo,
  updateNote,
  updateVideo,
} from './db'
import type { Note, Video } from './types'

const VIDEO_ID = 'dQw4w9WgXcQ'
const OTHER_VIDEO_ID = 'jNQXAC9IVRw'

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: VIDEO_ID,
    title: 'Test video',
    channel: 'Test channel',
    thumbnailUrl: `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
    lastPositionSec: 0,
    embeddable: true,
    tags: [],
    addedAt: 1_000,
    lastOpenedAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  }
}

function makeNote(
  id: string,
  overrides: Partial<Note> = {},
): Note {
  return {
    id,
    videoId: VIDEO_ID,
    kind: 'word',
    text: `note ${id}`,
    startSec: 10,
    endSec: 15,
    status: 'new',
    tags: [],
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  }
}

beforeEach(async () => {
  await deleteYouTubeDb()
})

describe('videos', () => {
  it('adds a video once and returns the existing row for a duplicate', async () => {
    const video = makeVideo()

    await expect(addVideo(video)).resolves.toEqual({ video, created: true })

    const duplicate = await addVideo({ ...video, title: 'Changed title' })
    expect(duplicate.created).toBe(false)
    expect(duplicate.video.title).toBe('Test video')
    expect(await listVideos()).toHaveLength(1)
  })

  it('sorts by last opened and hides soft-deleted videos', async () => {
    const older = makeVideo({ id: VIDEO_ID, lastOpenedAt: 100 })
    const newer = makeVideo({
      id: OTHER_VIDEO_ID,
      lastOpenedAt: 300,
      addedAt: 200,
    })

    await addVideo(older)
    await addVideo(newer)
    expect((await listVideos()).map((video) => video.id)).toEqual([
      OTHER_VIDEO_ID,
      VIDEO_ID,
    ])

    await softDeleteVideo(VIDEO_ID, 500)
    expect((await listVideos()).map((video) => video.id)).toEqual([
      OTHER_VIDEO_ID,
    ])

    await restoreVideo(VIDEO_ID, 600)
    expect((await listVideos()).map((video) => video.id)).toEqual([
      OTHER_VIDEO_ID,
      VIDEO_ID,
    ])
  })

  it('revives a soft-deleted video without creating a second row', async () => {
    const video = makeVideo()
    await addVideo(video)
    await softDeleteVideo(VIDEO_ID, 400)

    const revived = await addVideo({
      ...video,
      title: 'Revived',
      lastOpenedAt: 700,
      updatedAt: 700,
    })

    expect(revived.created).toBe(true)
    expect(revived.video.title).toBe('Revived')
    expect(revived.video.addedAt).toBe(video.addedAt)
    expect(revived.video.deletedAt).toBeUndefined()
    expect(await listVideos()).toHaveLength(1)
  })

  it('updates metadata and resume position without touching addedAt', async () => {
    await addVideo(makeVideo())

    const updated = await updateVideo(
      VIDEO_ID,
      { title: 'New title', lastPositionSec: 42 },
      2_000,
    )

    expect(updated?.title).toBe('New title')
    expect(updated?.lastPositionSec).toBe(42)
    expect(updated?.addedAt).toBe(1_000)
    expect(updated?.updatedAt).toBe(2_000)

    const touched = await touchVideo(VIDEO_ID, 3_000)
    expect(touched?.lastOpenedAt).toBe(3_000)
    expect((await getVideo(VIDEO_ID))?.lastOpenedAt).toBe(3_000)
  })

  it('does not update or delete a missing video', async () => {
    expect(await updateVideo(OTHER_VIDEO_ID, { title: 'x' })).toBeUndefined()
    expect(await softDeleteVideo(OTHER_VIDEO_ID)).toBeUndefined()
  })
})

describe('notes', () => {
  beforeEach(async () => {
    await addVideo(makeVideo())
  })

  it('adds, edits, and reads a note', async () => {
    await addNote(makeNote('a'))
    const edited = await updateNote(
      'a',
      { text: 'deployment', status: 'learning' },
      2_000,
    )

    expect(edited?.text).toBe('deployment')
    expect(edited?.status).toBe('learning')
    expect(edited?.createdAt).toBe(1_000)
    expect(edited?.updatedAt).toBe(2_000)
    expect((await getNote('a'))?.text).toBe('deployment')
  })

  it('soft-deletes and restores a note', async () => {
    await addNote(makeNote('a'))

    const deleted = await softDeleteNote('a', 2_000)
    expect(deleted?.deletedAt).toBe(2_000)
    expect(await listNotes()).toEqual([])
    expect(await listNotesForVideo(VIDEO_ID)).toEqual([])

    const restored = await restoreNote('a', 3_000)
    expect(restored?.deletedAt).toBeUndefined()
    expect(restored?.updatedAt).toBe(3_000)
    expect(await listNotes()).toHaveLength(1)
  })

  it('does not edit a deleted note', async () => {
    await addNote(makeNote('a'))
    await softDeleteNote('a', 2_000)

    expect(await updateNote('a', { text: 'nope' })).toBeUndefined()
  })

  it('lists notes for one video in playback order', async () => {
    await addNote(makeNote('late', { startSec: 40 }))
    await addNote(makeNote('early', { startSec: 5 }))
    await addNote(makeNote('deleted', { startSec: 20, deletedAt: 2_000 }))

    expect((await listNotesForVideo(VIDEO_ID)).map((note) => note.id)).toEqual([
      'early',
      'late',
    ])
  })

  it('searches text, meaning, and context case-insensitively', async () => {
    await addNote(
      makeNote('cache', {
        text: 'Cache',
        meaning: 'store data',
        context: 'browser',
        createdAt: 1_000,
      }),
    )
    await addNote(
      makeNote('deploy', {
        text: 'Deploy',
        meaning: 'ship to prod',
        context: 'standup',
        createdAt: 2_000,
      }),
    )
    await addNote(
      makeNote('deleted', {
        text: 'Cache invalidation',
        createdAt: 3_000,
        deletedAt: 3_500,
      }),
    )

    expect((await listNotes({ search: 'CACHE' })).map((note) => note.id)).toEqual([
      'cache',
    ])
    expect(
      (await listNotes({ search: 'store data' })).map((note) => note.id),
    ).toEqual(['cache'])
    expect(
      (await listNotes({ search: 'standup' })).map((note) => note.id),
    ).toEqual(['deploy'])
  })

  it('filters by status, tag, and video', async () => {
    await addVideo(
      makeVideo({ id: OTHER_VIDEO_ID, lastOpenedAt: 2_000, addedAt: 2_000 }),
    )
    await addNote(
      makeNote('a', { status: 'new', tags: ['frontend'], createdAt: 1_000 }),
    )
    await addNote(
      makeNote('b', {
        status: 'learning',
        tags: ['devops'],
        createdAt: 2_000,
      }),
    )
    await addNote(
      makeNote('other', {
        videoId: OTHER_VIDEO_ID,
        status: 'learning',
        tags: ['devops'],
        createdAt: 3_000,
      }),
    )

    expect(
      (await listNotes({ status: 'learning' })).map((note) => note.id),
    ).toEqual(['other', 'b'])
    expect((await listNotes({ tag: 'DEVOPS' })).map((note) => note.id)).toEqual([
      'other',
      'b',
    ])
    expect(
      (await listNotes({ videoId: OTHER_VIDEO_ID })).map((note) => note.id),
    ).toEqual(['other'])
  })

  it('hides notes belonging to a deleted video', async () => {
    await addNote(makeNote('a'))

    await softDeleteVideo(VIDEO_ID, 2_000)

    expect(await listNotes()).toEqual([])
    expect(await listNotes({ videoId: VIDEO_ID })).toEqual([])
  })

  it('counts active notes per video', async () => {
    await addVideo(makeVideo({ id: OTHER_VIDEO_ID, lastOpenedAt: 2_000 }))
    await addNote(makeNote('a', { createdAt: 1_000 }))
    await addNote(makeNote('b', { createdAt: 2_000 }))
    await addNote(
      makeNote('deleted', { createdAt: 3_000, deletedAt: 3_500 }),
    )
    await addNote(
      makeNote('other', { videoId: OTHER_VIDEO_ID, createdAt: 4_000 }),
    )

    expect(await countNotesByVideo()).toEqual({
      [VIDEO_ID]: 2,
      [OTHER_VIDEO_ID]: 1,
    })

    await softDeleteVideo(OTHER_VIDEO_ID, 5_000)
    expect(await countNotesByVideo()).toEqual({ [VIDEO_ID]: 2 })
  })
})
