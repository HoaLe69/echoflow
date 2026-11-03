import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import SearchBar from '../library/SearchBar'
import { listNotes, listVideos } from './db'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { formatTime } from './lib/time'
import type { Note, NoteStatus, Video } from './types'

type StatusFilter = NoteStatus | 'all'

const PAGE_SIZE = 50

const statusOptions: readonly SegmentedOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'known', label: 'Known' },
]

const statusTone = {
  new: 'neutral',
  learning: 'blush',
  known: 'primary-fixed',
} as const

const statusLabel: Record<NoteStatus, string> = {
  new: 'New',
  learning: 'Learning',
  known: 'Known',
}

export default function VocabularyPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [tag, setTag] = useState('all')
  const [page, setPage] = useState(1)
  const requestId = useRef(0)
  const debouncedQuery = useDebouncedValue(query, 250)

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current

    try {
      const [nextNotes, nextVideos] = await Promise.all([
        listNotes(),
        listVideos(),
      ])
      if (currentRequest !== requestId.current) return

      setNotes(nextNotes)
      setVideos(nextVideos)
      setError(null)
    } catch (loadError) {
      if (currentRequest !== requestId.current) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load your vocabulary.',
      )
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void reload()
  }, [reload])

  const videoMap = useMemo(
    () => new Map(videos.map((video) => [video.id, video])),
    [videos],
  )

  const tags = useMemo(
    () =>
      [...new Set(notes.flatMap((note) => note.tags))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [notes],
  )

  const needle = debouncedQuery.trim().toLowerCase()
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (status !== 'all' && note.status !== status) return false
      if (
        tag !== 'all' &&
        !note.tags.some((value) => value.toLowerCase() === tag.toLowerCase())
      ) {
        return false
      }
      if (!needle) return true

      return [note.text, note.meaning ?? '', note.context ?? '']
        .join('\n')
        .toLowerCase()
        .includes(needle)
    })
  }, [needle, notes, status, tag])

  const pageCount = Math.max(1, Math.ceil(filteredNotes.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageNotes = filteredNotes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const hasFilters = query.trim() !== '' || status !== 'all' || tag !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatus('all')
    setTag('all')
    setPage(1)
  }

  const countLabel =
    filteredNotes.length === 1 ? '1 note' : `${filteredNotes.length} notes`

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header
        subtitle="Vocabulary notebook"
        right={
          <Link
            to="/videos"
            aria-label="Open video library"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam"
          >
            <Icon name="video_library" className="text-base" />
            <span className="hidden sm:inline">Videos</span>
          </Link>
        }
      />

      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden px-4 pb-6 pt-8 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-10 top-1/3 h-64 w-64 rounded-full bg-mochi-blush/60 blur-3xl"
          />

          <div className="relative mx-auto flex max-w-7xl flex-col gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-hojicha">
                Every word, one place
              </p>
              <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-matcha-forest sm:text-4xl">
                Vocabulary notebook
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-matcha-sage sm:text-base">
                Search everything you saved, filter by status or tag, and jump
                straight back to the exact moment in the video.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SearchBar
                value={query}
                onChange={(value) => {
                  setQuery(value)
                  setPage(1)
                }}
                label="Search vocabulary"
                placeholder="Search word, meaning, or context…"
                className="flex-1"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="overflow-x-auto">
                  <SegmentedControl
                    label="Filter vocabulary by status"
                    options={statusOptions}
                    value={status}
                    onChange={(value) => {
                      setStatus(value)
                      setPage(1)
                    }}
                    className="w-max"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-matcha-forest">
                  <span className="sr-only">Filter by tag</span>
                  <select
                    value={tag}
                    onChange={(event) => {
                      setTag(event.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-full border border-primary/10 bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-matcha-forest shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"
                  >
                    <option value="all">All tags</option>
                    {tags.map((value) => (
                      <option key={value} value={value}>
                        #{value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-matcha-forest">
                  Saved vocabulary
                </h2>
                <span aria-live="polite">
                  <Pill tone="primary">
                    {isLoading ? 'Loading…' : countLabel}
                  </Pill>
                </span>
              </div>
              {!isLoading && filteredNotes.length > 0 ? (
                <span className="text-xs font-semibold text-matcha-sage">
                  Page {currentPage} of {pageCount}
                </span>
              ) : null}
            </div>

            {error ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-2 rounded-2xl border border-error/20 bg-error-container/50 px-4 py-3 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="focus-ring rounded-full bg-surface-container-lowest px-3.5 py-1.5 text-xs font-bold text-error shadow-sm"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <div
                role="status"
                className="rounded-3xl border border-dashed border-primary/15 bg-surface-container-lowest px-6 py-16 text-center text-sm font-semibold text-matcha-sage"
              >
                Loading vocabulary…
              </div>
            ) : pageNotes.length > 0 ? (
              <>
                <div className="flex flex-col gap-2.5">
                  {pageNotes.map((note) => {
                    const video = videoMap.get(note.videoId)
                    const time = Math.max(0, Math.floor(note.startSec))

                    return (
                      <Link
                        key={note.id}
                        to={`/videos/${note.videoId}?t=${time}`}
                        className="focus-ring group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-surface-container-lowest p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                            <Icon name="schedule" className="text-xs" />
                            {formatTime(note.startSec)}
                            {note.endSec !== undefined
                              ? `–${formatTime(note.endSec)}`
                              : ''}
                          </span>
                          <Pill tone={statusTone[note.status]} size="sm">
                            {statusLabel[note.status]}
                          </Pill>
                          <Pill size="sm">
                            {note.kind === 'phrase' ? 'Phrase' : 'Word'}
                          </Pill>
                          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold text-matcha-sage">
                            <Icon name="smart_display" className="text-sm" />
                            <span className="truncate">
                              {video?.title ?? 'Unknown video'}
                            </span>
                          </span>
                        </div>

                        <p className="break-words text-base font-bold leading-snug text-matcha-forest">
                          {note.text}
                        </p>

                        {note.meaning ? (
                          <p className="text-xs leading-relaxed text-matcha-sage">
                            <span className="font-bold text-matcha-forest">
                              Meaning:{' '}
                            </span>
                            {note.meaning}
                          </p>
                        ) : null}

                        {note.context ? (
                          <p className="line-clamp-2 text-xs italic leading-relaxed text-matcha-sage">
                            “{note.context}”
                          </p>
                        ) : null}

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {note.tags.map((value) => (
                              <span
                                key={value}
                                className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold text-matcha-sage"
                              >
                                #{value}
                              </span>
                            ))}
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary">
                            Open at {formatTime(note.startSec)}
                            <Icon
                              name="arrow_forward"
                              className="text-sm transition-transform group-hover:translate-x-0.5"
                            />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {filteredNotes.length > PAGE_SIZE ? (
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="focus-ring rounded-full border border-primary/15 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-matcha-sage">
                      {currentPage} / {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage(Math.min(pageCount, currentPage + 1))
                      }
                      disabled={currentPage === pageCount}
                      className="focus-ring rounded-full border border-primary/15 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            ) : notes.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-surface-container-lowest px-6 py-16 text-center">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-matcha-foam text-primary"
                >
                  <Icon name="menu_book" className="text-2xl" />
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-matcha-forest">
                  No vocabulary yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-matcha-sage">
                  Add your first note from a video, and it will show up here.
                </p>
                <Link
                  to="/videos"
                  className="focus-ring mt-5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
                >
                  Browse videos
                </Link>
              </div>
            ) : !error ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-surface-container-lowest px-6 py-16 text-center">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-matcha-foam text-primary"
                >
                  <Icon name="search_off" className="text-2xl" />
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-matcha-forest">
                  No notes match these filters
                </h3>
                <p className="mt-1 max-w-sm text-sm text-matcha-sage">
                  Try another word, status, or tag.
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="focus-ring mt-5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer
        shortcuts={[
          { key: 'N', label: 'add note' },
          { key: 'Space', label: 'play/pause' },
          { key: 'L', label: 'loop' },
        ]}
      />
    </div>
  )
}
