import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import type { Video } from './types'

type VideoCardProps = {
  video: Video
  noteCount: number
  onDelete: () => void
  isDeleting?: boolean
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function formatLastOpened(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp)

  if (elapsed < MINUTE) return 'Just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export default function VideoCard({
  video,
  noteCount,
  onDelete,
  isDeleting = false,
}: VideoCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const noteLabel = noteCount === 1 ? '1 note' : `${noteCount} notes`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-primary/10 bg-surface-container-lowest shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link
        to={`/videos/${video.id}`}
        aria-label={`Open ${video.title}`}
        className="focus-ring relative block aspect-video overflow-hidden bg-surface-container-high"
      >
        {imageFailed ? (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-matcha-foam text-primary"
          >
            <Icon name="smart_display" className="text-4xl" />
          </span>
        ) : (
          <img
            src={video.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
        <span className="absolute right-2.5 top-2.5">
          <Pill tone="quiet" size="sm" className="shadow-sm">
            <Icon name="notes" className="text-sm" />
            {noteLabel}
          </Pill>
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-matcha-forest/70 text-white shadow-lg backdrop-blur-sm">
            <Icon name="play_arrow" className="text-2xl" />
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/videos/${video.id}`}
              className="focus-ring rounded-lg"
            >
              <h3 className="line-clamp-2 font-headline text-base font-bold leading-snug text-matcha-forest transition-colors group-hover:text-primary">
                {video.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-xs font-medium text-matcha-sage">
              {video.channel}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete ${video.title}`}
            className="focus-ring -mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-outline/50 transition-colors hover:bg-error-container/60 hover:text-error disabled:opacity-40"
          >
            <Icon name="delete" className="text-lg" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-matcha-sage">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="history" className="text-sm" />
            {formatLastOpened(video.lastOpenedAt)}
          </span>
          <Link
            to={`/videos/${video.id}`}
            className="focus-ring inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold text-primary transition-colors hover:bg-matcha-foam"
          >
            Open
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </div>
    </article>
  )
}
