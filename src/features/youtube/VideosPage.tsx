import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import SearchBar from '../library/SearchBar'
import AddVideoBox from './AddVideoBox'
import BackupPanel from './BackupPanel'
import VideoCard from './VideoCard'
import { useVideos } from './hooks/useVideos'
import type { Video } from './types'

type VideoSort = 'recent' | 'notes'

const sortOptions: readonly SegmentedOption<VideoSort>[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'notes', label: 'Most notes' },
]

export default function VideosPage() {
  const { videos, noteCounts, isLoading, error, reload, removeVideo } =
    useVideos()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<VideoSort>('recent')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const visibleVideos = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return videos
      .filter((video) => {
        if (!needle) return true
        return `${video.title} ${video.channel}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        if (sort === 'notes') {
          const difference =
            (noteCounts[b.id] ?? 0) - (noteCounts[a.id] ?? 0)
          if (difference !== 0) return difference
        }

        return b.lastOpenedAt - a.lastOpenedAt
      })
  }, [videos, noteCounts, query, sort])

  const handleDelete = async (video: Video) => {
    const confirmed = window.confirm(
      `Delete “${video.title}” from your library? Its notes stay stored but will be hidden.`,
    )
    if (!confirmed) return

    setDeletingId(video.id)
    setActionError(null)

    try {
      await removeVideo(video.id)
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete this video.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const resetSearch = () => setQuery('')

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header
        subtitle="YouTube notebook"
        right={
          <Link
            to="/vocabulary"
            aria-label="Open vocabulary notebook"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-matcha-foam"
          >
            <Icon name="menu_book" className="text-base" />
            <span className="hidden sm:inline">Vocabulary</span>
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
                Watch · Notice · Remember
              </p>
              <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-matcha-forest sm:text-4xl">
                YouTube notebook
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-matcha-sage sm:text-base">
                Keep the English you hear in technical talks. Paste a video,
                then save words and phrases at the exact second they appear.
              </p>
            </div>

            <AddVideoBox onChanged={() => void reload()} />
          </div>
        </section>

        <section className="w-full px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-matcha-forest">
                  Your videos
                </h2>
                <span aria-live="polite">
                  <Pill tone="primary">
                    {isLoading
                      ? 'Loading…'
                      : `${visibleVideos.length} ${
                          visibleVideos.length === 1 ? 'video' : 'videos'
                        }`}
                  </Pill>
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  label="Search videos by title or channel"
                  placeholder="Search title or channel…"
                  className="sm:w-72"
                />
                <div className="overflow-x-auto">
                  <SegmentedControl
                    label="Sort videos"
                    options={sortOptions}
                    value={sort}
                    onChange={setSort}
                    className="w-max"
                  />
                </div>
              </div>
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

            {actionError ? (
              <p
                role="alert"
                className="rounded-2xl bg-error-container/60 px-4 py-2.5 text-xs font-semibold text-on-error-container"
              >
                {actionError}
              </p>
            ) : null}

            {isLoading ? (
              <div
                role="status"
                className="flex items-center justify-center rounded-3xl border border-dashed border-primary/15 bg-surface-container-lowest px-6 py-16 text-sm font-semibold text-matcha-sage"
              >
                Loading your videos…
              </div>
            ) : visibleVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    noteCount={noteCounts[video.id] ?? 0}
                    onDelete={() => void handleDelete(video)}
                    isDeleting={deletingId === video.id}
                  />
                ))}
              </div>
            ) : videos.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-surface-container-lowest px-6 py-16 text-center">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-matcha-foam text-primary"
                >
                  <Icon name="video_library" className="text-2xl" />
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-matcha-forest">
                  No videos yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-matcha-sage">
                  Paste a YouTube link above to start your first video
                  notebook.
                </p>
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
                  No videos match your search
                </h3>
                <p className="mt-1 max-w-sm text-sm text-matcha-sage">
                  Try a different title or channel.
                </p>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="focus-ring mt-5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
                >
                  Clear search
                </button>
              </div>
            ) : null}

            <BackupPanel onChanged={() => void reload()} />
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
