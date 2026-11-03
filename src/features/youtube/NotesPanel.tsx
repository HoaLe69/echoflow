import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import NoteItem from './NoteItem'
import type { Note } from './types'

type NotesPanelProps = {
  notes: Note[]
  activeNoteId: string | null
  isLoading: boolean
  error: string | null
  actionError: string | null
  onAdd: () => void
  onRetry: () => void
  onSelect: (note: Note) => void
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
}

export default function NotesPanel({
  notes,
  activeNoteId,
  isLoading,
  error,
  actionError,
  onAdd,
  onRetry,
  onSelect,
  onEdit,
  onDelete,
}: NotesPanelProps) {
  const countLabel = notes.length === 1 ? '1 note' : `${notes.length} notes`

  return (
    <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-headline text-lg font-bold text-matcha-forest">
            Notes
          </h2>
          <span aria-live="polite">
            <Pill tone="primary">{isLoading ? 'Loading…' : countLabel}</Pill>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-[11px] font-semibold text-matcha-sage sm:flex">
            <kbd className="rounded-md border border-primary/10 bg-surface-container-low px-1.5 py-0.5 font-bold text-matcha-forest">
              N
            </kbd>
            to add
          </span>
          <button
            type="button"
            onClick={onAdd}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
          >
            <Icon name="add_comment" className="text-base" />
            Add note
          </button>
        </div>
      </div>

      {actionError ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-error-container/60 px-3 py-2 text-xs font-semibold text-on-error-container"
        >
          {actionError}
        </p>
      ) : null}

      <div className="mt-4">
        {isLoading ? (
          <div
            role="status"
            className="rounded-2xl border border-dashed border-primary/15 bg-surface-container-low/50 px-4 py-10 text-center text-xs font-semibold text-matcha-sage"
          >
            Loading notes…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-error/20 bg-error-container/30 px-4 py-8 text-center"
          >
            <p className="text-xs font-semibold text-on-error-container">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="focus-ring rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary shadow-sm"
            >
              Try again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/20 bg-surface-container-low/50 px-4 py-10 text-center">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-matcha-foam text-primary"
            >
              <Icon name="sticky_note_2" className="text-xl" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-matcha-forest">
              Nothing saved yet
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-matcha-sage">
              Pause anywhere in the video and tap Add note — we’ll prefill the
              moment for you.
            </p>
            <button
              type="button"
              onClick={onAdd}
              className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam"
            >
              <Icon name="add_comment" className="text-base" />
              Add your first note
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onSelect={() => onSelect(note)}
                onEdit={() => onEdit(note)}
                onDelete={() => onDelete(note)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
