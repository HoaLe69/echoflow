import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import type { PillTone } from '../../components/Pill'
import { formatTime } from './lib/time'
import type { Note, NoteStatus } from './types'

type NoteItemProps = {
  note: Note
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

const statusTone: Record<NoteStatus, PillTone> = {
  new: 'neutral',
  learning: 'blush',
  known: 'primary-fixed',
}

const statusLabel: Record<NoteStatus, string> = {
  new: 'New',
  learning: 'Learning',
  known: 'Known',
}

export default function NoteItem({
  note,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: NoteItemProps) {
  const timeLabel = note.endSec
    ? `${formatTime(note.startSec)}–${formatTime(note.endSec)}`
    : formatTime(note.startSec)

  return (
    <article
      className={`rounded-2xl border p-3.5 transition-colors ${
        isActive
          ? 'border-primary/30 bg-matcha-foam/70 shadow-sm'
          : 'border-primary/10 bg-surface-container-lowest hover:border-primary/20 hover:bg-surface-container-low/60'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-current={isActive ? 'true' : undefined}
          className="focus-ring min-w-0 flex-1 rounded-xl text-left"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
              <Icon name="schedule" className="text-xs" />
              {timeLabel}
            </span>
            <Pill tone={statusTone[note.status]} size="sm">
              {statusLabel[note.status]}
            </Pill>
            <Pill size="sm">{note.kind === 'phrase' ? 'Phrase' : 'Word'}</Pill>
            {isActive ? (
              <Pill tone="primary" size="sm">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                />
                Now playing
              </Pill>
            ) : null}
          </div>

          <p className="mt-2 break-words text-sm font-bold leading-snug text-matcha-forest">
            {note.text}
          </p>

          {note.meaning ? (
            <p className="mt-1 text-xs leading-relaxed text-matcha-sage">
              <span className="font-bold text-matcha-forest">Meaning: </span>
              {note.meaning}
            </p>
          ) : null}

          {note.context ? (
            <p className="mt-1 line-clamp-2 text-xs italic leading-relaxed text-matcha-sage">
              “{note.context}”
            </p>
          ) : null}

          {note.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold text-matcha-sage"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit note ${note.text}`}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-outline/60 transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <Icon name="edit" className="text-base" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete note ${note.text}`}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-outline/60 transition-colors hover:bg-error-container/60 hover:text-error"
          >
            <Icon name="delete" className="text-base" />
          </button>
        </div>
      </div>
    </article>
  )
}
