export type NoteKind = 'word' | 'phrase'

export type NoteStatus = 'new' | 'learning' | 'known'

export type Video = {
  /** YouTube video ID (11 chars), primary key. */
  id: string
  title: string
  channel: string
  thumbnailUrl: string
  durationSec?: number
  lastPositionSec: number
  /** False after the player reports error 101 or 150. */
  embeddable: boolean
  tags: string[]
  addedAt: number
  lastOpenedAt: number
  updatedAt: number
  deletedAt?: number
}

export type Note = {
  /** crypto.randomUUID(), primary key. */
  id: string
  videoId: string
  kind: NoteKind
  text: string
  meaning?: string
  context?: string
  startSec: number
  endSec?: number
  status: NoteStatus
  tags: string[]
  createdAt: number
  updatedAt: number
  deletedAt?: number
}
