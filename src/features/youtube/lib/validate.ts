import { isYouTubeVideoId } from './parseYouTubeUrl'
import type { Note, NoteKind, NoteStatus, Video } from '../types'

const NOTE_KINDS = new Set<NoteKind>(['word', 'phrase'])
const NOTE_STATUSES = new Set<NoteStatus>(['new', 'learning', 'known'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value)
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isNoteStatus(value: unknown): value is NoteStatus {
  return typeof value === 'string' && NOTE_STATUSES.has(value as NoteStatus)
}

export function isVideoRecord(value: unknown): value is Video {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    isYouTubeVideoId(value.id) &&
    typeof value.title === 'string' &&
    typeof value.channel === 'string' &&
    typeof value.thumbnailUrl === 'string' &&
    isOptionalNumber(value.durationSec) &&
    isFiniteNumber(value.lastPositionSec) &&
    typeof value.embeddable === 'boolean' &&
    isStringArray(value.tags) &&
    isFiniteNumber(value.addedAt) &&
    isFiniteNumber(value.lastOpenedAt) &&
    isFiniteNumber(value.updatedAt) &&
    isOptionalNumber(value.deletedAt)
  )
}

export function isNoteRecord(value: unknown): value is Note {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.videoId === 'string' &&
    isYouTubeVideoId(value.videoId) &&
    typeof value.kind === 'string' &&
    NOTE_KINDS.has(value.kind as NoteKind) &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    isOptionalString(value.meaning) &&
    isOptionalString(value.context) &&
    isFiniteNumber(value.startSec) &&
    value.startSec >= 0 &&
    isOptionalNumber(value.endSec) &&
    isNoteStatus(value.status) &&
    isStringArray(value.tags) &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.updatedAt) &&
    isOptionalNumber(value.deletedAt)
  )
}
