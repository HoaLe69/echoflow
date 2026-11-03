import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../../components/Icon'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import { formatTime } from './lib/time'
import type { Note, NoteKind, NoteStatus } from './types'

export type NoteDraft = {
  kind: NoteKind
  text: string
  meaning?: string
  context?: string
  startSec: number
  endSec?: number
  status: NoteStatus
  tags: string[]
}

type NoteFormProps = {
  /** Null when adding a new note. */
  note: Note | null
  defaults: {
    startSec: number
    endSec: number
  }
  onClose: () => void
  onSubmit: (draft: NoteDraft) => void
  onPreview: (startSec: number, endSec: number | undefined) => void
  isSaving?: boolean
  error?: string | null
  /** False when the video is not embeddable. */
  canPreview?: boolean
}

const inputClasses =
  'w-full rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm text-matcha-forest transition-colors placeholder:text-matcha-sage/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

const kindOptions: readonly SegmentedOption<NoteKind>[] = [
  { value: 'word', label: 'Word' },
  { value: 'phrase', label: 'Phrase' },
]

const statusOptions: readonly { value: NoteStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'known', label: 'Known' },
]

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function clampTime(value: number): number {
  return Math.max(0, roundTenth(value))
}

export default function NoteForm({
  note,
  defaults,
  onClose,
  onSubmit,
  onPreview,
  isSaving = false,
  error = null,
  canPreview = true,
}: NoteFormProps) {
  const titleId = useId()
  const [kind, setKind] = useState<NoteKind>(note?.kind ?? 'word')
  const [text, setText] = useState(note?.text ?? '')
  const [meaning, setMeaning] = useState(note?.meaning ?? '')
  const [context, setContext] = useState(note?.context ?? '')
  const [status, setStatus] = useState<NoteStatus>(note?.status ?? 'new')
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') ?? '')
  const [startSec, setStartSec] = useState(
    note?.startSec ?? defaults.startSec,
  )
  const [endSec, setEndSec] = useState<number | null>(
    note ? (note.endSec ?? null) : defaults.endSec,
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const endInvalid = endSec !== null && endSec <= startSec
  const shownError = validationError ?? error

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedText = text.trim()

    if (!trimmedText) {
      setValidationError('Add the word or phrase you want to remember.')
      return
    }

    if (endInvalid) {
      setValidationError('The end time must be after the start time.')
      return
    }

    setValidationError(null)
    const tags = [
      ...new Set(
        tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ]

    onSubmit({
      kind,
      text: trimmedText,
      meaning: meaning.trim() || undefined,
      context: context.trim() || undefined,
      startSec: clampTime(startSec),
      endSec: endSec === null ? undefined : clampTime(endSec),
      status,
      tags,
    })
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onMouseDown={onClose}
        className="pointer-events-auto absolute inset-x-0 bottom-0 top-[calc(4rem+56.25vw+1rem)] bg-matcha-forest/30 backdrop-blur-sm sm:inset-0 sm:top-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pointer-events-auto relative mt-[calc(4rem+56.25vw+1rem)] max-h-[calc(100dvh-5rem-56.25vw)] w-full overflow-y-auto rounded-t-3xl border border-primary/15 bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:mt-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-outline-variant sm:hidden"
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="font-headline text-lg font-bold text-matcha-forest"
            >
              {note ? 'Edit note' : 'Add a note'}
            </h2>
            <p className="mt-1 text-xs text-matcha-sage">
              {note
                ? 'Update the word, meaning, or the moment it belongs to.'
                : 'Save the word or phrase at the moment you heard it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close note form"
            className="focus-ring -mr-1 -mt-1 rounded-full p-1.5 text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-matcha-forest"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Note kind"
              options={kindOptions}
              value={kind}
              onChange={setKind}
            />
            <label className="flex flex-1 items-center gap-2 text-xs font-bold text-matcha-forest">
              <span className="sr-only">Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as NoteStatus)
                }
                className="w-full rounded-full border border-primary/10 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-matcha-forest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-matcha-forest">
              Word or phrase <span aria-hidden="true">*</span>
            </span>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="e.g. fallback to"
              autoFocus
              required
              className={inputClasses}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">
                Meaning
              </span>
              <textarea
                value={meaning}
                onChange={(event) => setMeaning(event.target.value)}
                rows={2}
                placeholder="What it means in your own words"
                className={`${inputClasses} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">
                Context
              </span>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                rows={2}
                placeholder="The sentence you heard it in"
                className={`${inputClasses} resize-none`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">
                Start time
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStartSec((value) => clampTime(value - 0.5))}
                  aria-label="Start time earlier by half a second"
                  className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-surface-container-low text-sm font-bold text-primary transition-colors hover:bg-matcha-foam"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={startSec}
                  onChange={(event) =>
                    setStartSec(clampTime(event.target.valueAsNumber || 0))
                  }
                  aria-label="Start time in seconds"
                  className={`${inputClasses} text-center`}
                />
                <button
                  type="button"
                  onClick={() => setStartSec((value) => clampTime(value + 0.5))}
                  aria-label="Start time later by half a second"
                  className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-surface-container-low text-sm font-bold text-primary transition-colors hover:bg-matcha-foam"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-matcha-sage">
                {formatTime(startSec)} · in seconds
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">
                End time
              </span>
              {endSec === null ? (
                <button
                  type="button"
                  onClick={() => setEndSec(clampTime(startSec + 5))}
                  className="focus-ring flex h-9 items-center justify-center rounded-xl border border-dashed border-primary/20 text-xs font-semibold text-matcha-sage transition-colors hover:bg-matcha-foam hover:text-primary"
                >
                  Set an end time
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEndSec((value) =>
                        value === null ? null : clampTime(value - 0.5),
                      )
                    }
                    aria-label="End time earlier by half a second"
                    className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-surface-container-low text-sm font-bold text-primary transition-colors hover:bg-matcha-foam"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={endSec}
                    onChange={(event) => {
                      const raw = event.target.value
                      if (!raw.trim()) {
                        setEndSec(null)
                        return
                      }
                      setEndSec(clampTime(event.target.valueAsNumber || 0))
                    }}
                    aria-label="End time in seconds"
                    className={`${inputClasses} text-center`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEndSec((value) =>
                        value === null ? null : clampTime(value + 0.5),
                      )
                    }
                    aria-label="End time later by half a second"
                    className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-surface-container-low text-sm font-bold text-primary transition-colors hover:bg-matcha-foam"
                  >
                    +
                  </button>
                </div>
              )}
              <span className="text-[11px] text-matcha-sage">
                {endSec === null
                  ? 'Playback will keep going'
                  : `${formatTime(endSec)} · pause here`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPreview(startSec, endSec ?? undefined)}
              disabled={endInvalid || !canPreview}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container-low px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam disabled:opacity-50"
            >
              <Icon name="play_arrow" className="text-base" />
              Preview {formatTime(startSec)}
              {endSec !== null ? `–${formatTime(endSec)}` : ''}
            </button>
            <span className="text-[11px] text-matcha-sage">
              {canPreview
                ? 'The player is above the sheet — preview without closing.'
                : 'Preview needs the embedded player.'}
            </span>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-matcha-forest">
              Tags <span className="font-medium text-matcha-sage">(optional, comma separated)</span>
            </span>
            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="backend, meetings, idioms"
              className={inputClasses}
            />
          </label>

          {shownError ? (
            <p
              role="alert"
              className="rounded-xl bg-error-container/70 px-3 py-2 text-xs font-semibold text-on-error-container"
            >
              {shownError}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full px-4 py-2 text-xs font-semibold text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-matcha-forest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="focus-ring rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : note ? 'Save changes' : 'Add note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
