import { describe, expect, it } from 'vitest'
import type { Note } from '../types'
import { findActiveNote } from './activeNote'

function makeNote(
  id: string,
  startSec: number,
  endSec?: number,
): Note {
  return {
    id,
    videoId: 'dQw4w9WgXcQ',
    kind: 'word',
    text: id,
    startSec,
    endSec,
    status: 'new',
    tags: [],
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('findActiveNote', () => {
  it('returns the containing note including both boundaries', () => {
    const note = makeNote('a', 10, 20)

    expect(findActiveNote([note], 9.99)).toBeNull()
    expect(findActiveNote([note], 10)?.id).toBe('a')
    expect(findActiveNote([note], 15)?.id).toBe('a')
    expect(findActiveNote([note], 20)?.id).toBe('a')
    expect(findActiveNote([note], 20.01)).toBeNull()
  })

  it('prefers the most recently started note when ranges overlap', () => {
    const first = makeNote('first', 10, 30)
    const second = makeNote('second', 15, 20)

    expect(findActiveNote([first, second], 12)?.id).toBe('first')
    expect(findActiveNote([first, second], 16)?.id).toBe('second')
    expect(findActiveNote([first, second], 22)?.id).toBe('first')
    expect(findActiveNote([first, second], 31)).toBeNull()
  })

  it('treats a note without endSec as open-ended', () => {
    const note = makeNote('open', 10)

    expect(findActiveNote([note], 10)?.id).toBe('open')
    expect(findActiveNote([note], 10_000)?.id).toBe('open')
  })

  it('does not mutate the input order', () => {
    const later = makeNote('later', 20, 25)
    const earlier = makeNote('earlier', 10, 15)
    const notes = [later, earlier]

    expect(findActiveNote(notes, 22)?.id).toBe('later')
    expect(notes.map((note) => note.id)).toEqual(['later', 'earlier'])
  })

  it('returns null for an empty list', () => {
    expect(findActiveNote([], 12)).toBeNull()
  })
})
