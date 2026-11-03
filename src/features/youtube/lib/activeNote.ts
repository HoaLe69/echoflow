import type { Note } from '../types'

/**
 * Pick the note whose time range contains `seconds`. Ranges are inclusive at
 * both boundaries. When ranges overlap, the note that started most recently
 * wins. A note without `endSec` has no upper bound; overlapping notes resolve to
 * the most recently started one.
 */
export function findActiveNote(notes: Note[], seconds: number): Note | null {
  let active: Note | null = null

  for (const note of notes) {
    if (seconds < note.startSec) continue
    if (note.endSec !== undefined && seconds > note.endSec) continue
    if (!active || note.startSec > active.startSec) active = note
  }

  return active
}
