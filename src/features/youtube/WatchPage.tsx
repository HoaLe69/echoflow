import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import Header from '../../components/Header'
import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import {
  addNote,
  getVideo,
  restoreNote,
  softDeleteNote,
  touchVideo,
  updateNote,
  updateVideo,
} from './db'
import { useNotes } from './hooks/useNotes'
import { findActiveNote } from './lib/activeNote'
import { isInteractiveTarget, isTypingTarget } from './lib/keyboard'
import { formatTime, parseTime } from './lib/time'
import { YOUTUBE_PLAYER_STATE } from './lib/youtubeApi'
import type { YouTubePlayerState } from './lib/youtubeApi'
import NoteForm from './NoteForm'
import type { NoteDraft } from './NoteForm'
import NotesPanel from './NotesPanel'
import ShortcutsHelp from './ShortcutsHelp'
import UndoToast from './UndoToast'
import YouTubePlayer from './YouTubePlayer'
import type { YouTubePlayerHandle } from './YouTubePlayer'
import type { Note, Video } from './types'

type WatchLocationState = {
  flash?: string
}

type NoteFormState =
  | { mode: 'add'; startSec: number; endSec: number }
  | { mode: 'edit'; note: Note }

type ToastState = {
  noteId: string
  message: string
}

type Speed = '0.75' | '1' | '1.25'

type PlaybackRange = {
  startSec: number
  endSec: number
}

const speedOptions: readonly SegmentedOption<Speed>[] = [
  { value: '0.75', label: '0.75x' },
  { value: '1', label: '1x' },
  { value: '1.25', label: '1.25x' },
]

function readFlash(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null
  const flash = (state as WatchLocationState).flash
  return typeof flash === 'string' ? flash : null
}

function playerErrorMessage(code: number | null, embeddable: boolean): string {
  if (!embeddable && code === null) {
    return 'The video owner does not allow this video to be embedded.'
  }
  if (code === 100) return 'This video is private or no longer available.'
  if (code === 101 || code === 150) {
    return 'The video owner does not allow this video to be embedded.'
  }
  if (code === 2) return 'The player could not start with this video.'
  if (code === 5) return 'The player hit an HTML5 playback error.'
  return 'This video cannot be played in the embedded player.'
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function truncate(value: string, maxLength = 64): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}…`
    : value
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const playerRef = useRef<YouTubePlayerHandle>(null)
  const playerShellRef = useRef<HTMLDivElement>(null)
  const currentTimeRef = useRef(0)
  const playbackRangeRef = useRef<PlaybackRange | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedPositionRef = useRef(0)
  const videoIdRef = useRef<string | null>(null)
  const isPlayingRef = useRef(false)
  const loopRef = useRef(false)

  const [video, setVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState<number | null>(null)
  const [embeddable, setEmbeddable] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerAttempt, setPlayerAttempt] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [speed, setSpeed] = useState<Speed>('1')

  const [formState, setFormState] = useState<NoteFormState | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [noteActionError, setNoteActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const flash = readFlash(location.state)
  const {
    notes,
    isLoading: notesLoading,
    error: notesError,
    reload: reloadNotes,
  } = useNotes(video?.id)
  const activeNote = findActiveNote(notes, currentTime)

  const requestedStart = searchParams.get('t')
  const parsedStart = requestedStart ? parseTime(requestedStart) : null
  const resumeTime =
    parsedStart !== null ? parsedStart : (video?.lastPositionSec ?? 0)
  const displayError =
    error ?? (id ? null : 'This video is not in your notebook.')

  useEffect(() => {
    if (!id) return

    let active = true

    const load = async () => {
      setVideo(null)
      setError(null)
      setPlayerError(null)
      setEmbeddable(true)
      setCurrentTime(0)
      setIsPlaying(false)
      isPlayingRef.current = false
      setIsLoading(true)

      try {
        const found = await getVideo(id)
        if (!active) return

        if (!found || found.deletedAt) {
          setError('This video is not in your notebook.')
          return
        }

        setVideo(found)
        setEmbeddable(found.embeddable)

        const searchStart = parseTime(
          new URLSearchParams(window.location.search).get('t') ?? '',
        )
        const resumeAt =
          searchStart !== null ? searchStart : found.lastPositionSec
        currentTimeRef.current = Math.max(0, resumeAt)
        setCurrentTime(Math.max(0, resumeAt))
        lastSavedPositionRef.current = found.lastPositionSec

        try {
          const opened = await touchVideo(id)
          if (active && opened) setVideo(opened)
        } catch {
          // Opening the page still works if the lastOpenedAt write fails.
        }
      } catch (loadError) {
        if (!active) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load this video.',
        )
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    videoIdRef.current = video?.id ?? null
  }, [video?.id])

  const persistPosition = useCallback((seconds: number) => {
    const videoId = videoIdRef.current
    if (!videoId || !Number.isFinite(seconds) || seconds <= 0) return

    const rounded = Math.floor(seconds)
    if (Math.abs(rounded - lastSavedPositionRef.current) < 1) return

    lastSavedPositionRef.current = rounded
    void updateVideo(videoId, { lastPositionSec: rounded }).catch(() => {
      // Resume position is best-effort.
    })
  }, [])

  const cancelScheduledPositionSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [])

  const schedulePositionSave = useCallback(() => {
    cancelScheduledPositionSave()
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      persistPosition(currentTimeRef.current)
    }, 600)
  }, [cancelScheduledPositionSave, persistPosition])

  useEffect(() => {
    const saveNow = () => persistPosition(currentTimeRef.current)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }

    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', handleVisibility)
      cancelScheduledPositionSave()
      saveNow()
    }
  }, [cancelScheduledPositionSave, persistPosition])

  useEffect(() => {
    if (!video?.id) return

    return () => {
      persistPosition(currentTimeRef.current)
    }
  }, [persistPosition, video?.id])

  const pinPlayerForSheet = useCallback(() => {
    if (window.innerWidth >= 640) return

    const shell = playerShellRef.current
    if (!shell) return

    const top = shell.getBoundingClientRect().top
    if (top > 64) {
      window.scrollBy({ top: top - 64, behavior: 'auto' })
    }
  }, [])

  const openAddForm = useCallback(() => {
    playerRef.current?.pause()
    playbackRangeRef.current = null
    pinPlayerForSheet()

    const playerTime = playerRef.current?.getTime()
    const baseTime =
      playerTime !== undefined && Number.isFinite(playerTime)
        ? playerTime
        : currentTimeRef.current
    if (baseTime !== currentTimeRef.current) {
      currentTimeRef.current = baseTime
      setCurrentTime(baseTime)
    }
    const start = Math.max(0, roundTenth(baseTime - 2))
    setFormState({
      mode: 'add',
      startSec: start,
      endSec: roundTenth(start + 5),
    })
    setFormKey((key) => key + 1)
    setFormError(null)
  }, [pinPlayerForSheet])

  const openEditForm = (note: Note) => {
    playerRef.current?.pause()
    playbackRangeRef.current = null
    pinPlayerForSheet()
    setFormState({ mode: 'edit', note })
    setFormKey((key) => key + 1)
    setFormError(null)
  }

  const closeForm = useCallback(() => {
    if (isSaving) return
    playbackRangeRef.current = null
    playerRef.current?.pause()
    setFormState(null)
    setFormError(null)
  }, [isSaving])

  const handleTime = (seconds: number) => {
    currentTimeRef.current = seconds
    setCurrentTime(seconds)

    const range = playbackRangeRef.current
    if (!range || seconds < range.endSec) return

    if (loopRef.current) {
      playerRef.current?.seekTo(range.startSec, true)
      playerRef.current?.play()
      currentTimeRef.current = range.startSec
      setCurrentTime(range.startSec)
      return
    }

    playbackRangeRef.current = null
    playerRef.current?.pause()
    playerRef.current?.seekTo(range.endSec, true)
    currentTimeRef.current = range.endSec
    setCurrentTime(range.endSec)
  }

  const handleStateChange = (state: YouTubePlayerState) => {
    const playing =
      state === YOUTUBE_PLAYER_STATE.PLAYING ||
      state === YOUTUBE_PLAYER_STATE.BUFFERING

    isPlayingRef.current = playing
    setIsPlaying(playing)

    if (state === YOUTUBE_PLAYER_STATE.PLAYING) {
      cancelScheduledPositionSave()
    }

    if (
      state === YOUTUBE_PLAYER_STATE.PAUSED ||
      state === YOUTUBE_PLAYER_STATE.ENDED
    ) {
      schedulePositionSave()
    }
  }

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      playerRef.current?.pause()
    } else {
      playerRef.current?.play()
    }
  }, [])

  const seekBy = (deltaSeconds: number) => {
    playbackRangeRef.current = null
    const player = playerRef.current
    const base = player?.getTime() ?? currentTimeRef.current
    const target = Math.max(0, base + deltaSeconds)

    player?.seekTo(target, true)
    currentTimeRef.current = target
    setCurrentTime(target)
  }

  const toggleLoop = useCallback(() => {
    setLoop((current) => {
      const next = !current
      loopRef.current = next
      return next
    })
  }, [])

  const handleReady = (duration: number) => {
    if (!video || !Number.isFinite(duration) || duration <= 0) return
    if (
      video.durationSec !== undefined &&
      Math.abs(video.durationSec - duration) < 1
    ) {
      return
    }

    void updateVideo(video.id, { durationSec: Math.round(duration) })
      .then((updated) => {
        if (updated) setVideo(updated)
      })
      .catch(() => {
        // Duration is optional metadata.
      })
  }

  const handlePlayerError = (code: number) => {
    setPlayerError(code)
    isPlayingRef.current = false
    setIsPlaying(false)

    if (code !== 101 && code !== 150) return

    setEmbeddable(false)
    if (!video) return

    void updateVideo(video.id, { embeddable: false })
      .then((updated) => {
        if (updated) setVideo(updated)
      })
      .catch(() => {
        // The fallback stays usable even if the flag cannot be persisted.
      })
  }

  const retryPlayer = () => {
    setPlayerError(null)
    setPlayerAttempt((attempt) => attempt + 1)
  }

  const handleSelectNote = (note: Note) => {
    playbackRangeRef.current =
      note.endSec !== undefined
        ? { startSec: note.startSec, endSec: note.endSec }
        : null
    currentTimeRef.current = note.startSec
    setCurrentTime(note.startSec)

    if (embeddable && playerError === null) {
      playerRef.current?.seekTo(note.startSec, true)
      playerRef.current?.play()
    }
  }

  const handlePreview = (startSec: number, endSec: number | undefined) => {
    playbackRangeRef.current =
      endSec !== undefined ? { startSec, endSec } : null
    currentTimeRef.current = startSec
    setCurrentTime(startSec)

    if (embeddable && playerError === null) {
      playerRef.current?.seekTo(startSec, true)
      playerRef.current?.play()
    }
  }

  const handleNoteSubmit = async (draft: NoteDraft) => {
    if (!video || !formState) return

    setIsSaving(true)
    setFormError(null)
    const now = Date.now()

    try {
      if (formState.mode === 'edit') {
        const updated = await updateNote(
          formState.note.id,
          {
            kind: draft.kind,
            text: draft.text,
            meaning: draft.meaning,
            context: draft.context,
            startSec: draft.startSec,
            endSec: draft.endSec,
            status: draft.status,
            tags: draft.tags,
          },
          now,
        )

        if (!updated) {
          throw new Error('This note no longer exists.')
        }
      } else {
        await addNote({
          id: crypto.randomUUID(),
          videoId: video.id,
          kind: draft.kind,
          text: draft.text,
          meaning: draft.meaning,
          context: draft.context,
          startSec: draft.startSec,
          endSec: draft.endSec,
          status: draft.status,
          tags: draft.tags,
          createdAt: now,
          updatedAt: now,
        })
      }

      await reloadNotes()
      setFormState(null)
      setFormError(null)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this note.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const showToast = useCallback((noteId: string, message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToast({ noteId, message })
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 5_000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setToast(null)
  }, [])

  const handleUndo = async () => {
    if (!toast) return
    const noteId = toast.noteId
    dismissToast()
    setNoteActionError(null)

    try {
      await restoreNote(noteId)
      await reloadNotes()
    } catch (restoreError) {
      setNoteActionError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Could not restore this note.',
      )
    }
  }

  const handleDeleteNote = async (note: Note) => {
    setNoteActionError(null)

    try {
      await softDeleteNote(note.id)
      await reloadNotes()
      showToast(note.id, `Deleted “${truncate(note.text)}”.`)
    } catch (deleteError) {
      setNoteActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete this note.',
      )
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        formState ||
        !video
      ) {
        return
      }

      if (event.code === 'Space') {
        if (isInteractiveTarget(event.target)) return
        event.preventDefault()
        togglePlay()
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'n') {
        event.preventDefault()
        openAddForm()
      } else if (key === 'l') {
        event.preventDefault()
        toggleLoop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formState, openAddForm, toggleLoop, togglePlay, video])

  const externalSeconds = Math.max(0, Math.floor(currentTime))
  const externalUrl = video
    ? `https://youtu.be/${video.id}?t=${externalSeconds}`
    : 'https://youtube.com'
  const playerUnavailable = !embeddable || playerError !== null

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header
        subtitle="YouTube notebook"
        right={
          <Link
            to="/videos"
            aria-label="All videos"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam"
          >
            <Icon name="video_library" className="text-base" />
            <span className="hidden sm:inline">All videos</span>
          </Link>
        }
      />

      <main className="flex-1 pt-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6">
          <Link
            to="/videos"
            className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-full text-xs font-bold text-matcha-sage transition-colors hover:text-matcha-forest"
          >
            <Icon name="arrow_back" className="text-base" />
            Back to videos
          </Link>

          {flash ? (
            <p
              role="status"
              className="rounded-2xl bg-matcha-foam px-4 py-2.5 text-xs font-semibold text-primary"
            >
              {flash}
            </p>
          ) : null}

          {displayError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-error/20 bg-error-container/30 px-6 py-12 text-center"
            >
              <Icon name="error" className="text-3xl text-error" />
              <p className="text-sm font-semibold text-on-error-container">
                {displayError}
              </p>
              <Link
                to="/videos"
                className="focus-ring rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm"
              >
                Back to videos
              </Link>
            </div>
          ) : isLoading ? (
            <p
              role="status"
              className="rounded-3xl border border-dashed border-primary/15 bg-surface-container-lowest px-6 py-16 text-center text-sm font-semibold text-matcha-sage"
            >
              Loading video…
            </p>
          ) : video ? (
            <div className="flex flex-col gap-4">
              <div
                ref={playerShellRef}
                className="sticky top-16 z-30 -mx-4 bg-surface/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0 lg:static"
              >
                <div className="overflow-hidden rounded-3xl border border-primary/10 bg-black shadow-card">
                  {playerUnavailable ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-matcha-forest px-6 text-center text-white">
                      <Icon
                        name={playerError === 100 ? 'lock' : 'link_off'}
                        className="text-4xl text-white/80"
                      />
                      <p className="max-w-sm text-sm font-semibold">
                        {playerErrorMessage(playerError, embeddable)}
                      </p>
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-matcha-forest shadow-sm"
                      >
                        Open on YouTube at {formatTime(externalSeconds)}
                        <Icon name="open_in_new" className="text-sm" />
                      </a>
                      {playerError === 2 || playerError === 5 ? (
                        <button
                          type="button"
                          onClick={retryPlayer}
                          className="focus-ring rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 underline-offset-4 transition-colors hover:bg-white/10 hover:underline"
                        >
                          Try the player again
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <YouTubePlayer
                      key={playerAttempt}
                      ref={playerRef}
                      videoId={video.id}
                      initialTime={resumeTime}
                      playbackRate={Number(speed)}
                      onTime={handleTime}
                      onStateChange={handleStateChange}
                      onError={handlePlayerError}
                      onReady={handleReady}
                    />
                  )}
                </div>
              </div>

              {playerUnavailable ? null : (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/10 bg-surface-container-lowest p-2.5 shadow-card">
                  <div className="flex min-w-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      className="focus-ring inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                    >
                      <Icon
                        name={isPlaying ? 'pause' : 'play_arrow'}
                        className="text-base"
                      />
                      <span className="hidden sm:inline">
                        {isPlaying ? 'Pause' : 'Play'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => seekBy(-5)}
                      aria-label="Seek back 5 seconds"
                      className="focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-primary"
                    >
                      <Icon name="replay_5" className="text-base" />
                      <span className="hidden sm:inline">5s</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => seekBy(5)}
                      aria-label="Seek forward 5 seconds"
                      className="focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-primary"
                    >
                      <Icon name="forward_5" className="text-base" />
                      <span className="hidden sm:inline">5s</span>
                    </button>

                    <span className="ml-1 whitespace-nowrap font-mono text-[11px] font-semibold text-matcha-sage">
                      {formatTime(currentTime)}
                      {video.durationSec
                        ? ` / ${formatTime(video.durationSec)}`
                        : ''}
                    </span>
                  </div>

                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <SegmentedControl
                      label="Playback speed"
                      options={speedOptions}
                      value={speed}
                      onChange={setSpeed}
                    />
                    <button
                      type="button"
                      onClick={toggleLoop}
                      aria-pressed={loop}
                      aria-label="Toggle note loop"
                      className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                        loop
                          ? 'border-primary bg-primary text-on-primary shadow-sm'
                          : 'border-primary/15 bg-surface-container-low text-matcha-sage hover:bg-matcha-foam hover:text-primary'
                      }`}
                    >
                      <Icon name="repeat" className="text-base" />
                      Loop
                    </button>
                    <ShortcutsHelp />
                  </div>
                </div>
              )}

              <article className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="primary">Saved video</Pill>
                  {video.durationSec ? (
                    <Pill>{formatTime(video.durationSec)}</Pill>
                  ) : null}
                  <Pill>{notes.length === 1 ? '1 note' : `${notes.length} notes`}</Pill>
                  {!embeddable ? (
                    <Pill tone="blush">Embedding unavailable</Pill>
                  ) : null}
                </div>
                <h1 className="mt-2 font-headline text-2xl font-extrabold leading-tight text-matcha-forest">
                  {video.title}
                </h1>
                <p className="mt-1 text-sm font-medium text-matcha-sage">
                  {video.channel}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-primary/10 pt-4">
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam"
                  >
                    <Icon name="open_in_new" className="text-sm" />
                    Open on YouTube at {formatTime(externalSeconds)}
                  </a>
                  <span className="text-xs text-matcha-sage">
                    Playback starts only when you tap.
                  </span>
                </div>
              </article>

              <NotesPanel
                notes={notes}
                activeNoteId={activeNote?.id ?? null}
                isLoading={notesLoading}
                error={notesError}
                actionError={noteActionError}
                onAdd={openAddForm}
                onRetry={() => void reloadNotes()}
                onSelect={handleSelectNote}
                onEdit={openEditForm}
                onDelete={(note) => void handleDeleteNote(note)}
              />
            </div>
          ) : null}
        </div>
      </main>

      {formState && video ? (
        <NoteForm
          key={formKey}
          note={formState.mode === 'edit' ? formState.note : null}
          defaults={
            formState.mode === 'edit'
              ? {
                  startSec: formState.note.startSec,
                  endSec: formState.note.endSec ?? formState.note.startSec + 5,
                }
              : {
                  startSec: formState.startSec,
                  endSec: formState.endSec,
                }
          }
          onClose={closeForm}
          onSubmit={(draft) => void handleNoteSubmit(draft)}
          onPreview={handlePreview}
          isSaving={isSaving}
          error={formError}
          canPreview={embeddable && playerError === null}
        />
      ) : null}

      {toast ? (
        <UndoToast
          message={toast.message}
          onUndo={() => void handleUndo()}
          onDismiss={dismissToast}
        />
      ) : null}
    </div>
  )
}
