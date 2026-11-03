import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { addVideo, getVideo, updateVideo } from './db'
import { fetchYouTubeMetadata } from './lib/metadata'
import { parseYouTubeUrl } from './lib/parseYouTubeUrl'
import type { Video } from './types'

type AddVideoBoxProps = {
  /** Called after a new video is stored or its metadata changes. */
  onChanged: () => void
}

const inputClasses =
  'w-full rounded-2xl border border-primary/10 bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-matcha-forest shadow-sm transition-all placeholder:text-matcha-sage/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export default function AddVideoBox({ onChanged }: AddVideoBoxProps) {
  const navigate = useNavigate()
  const urlId = useId()
  const titleId = useId()
  const errorId = useId()

  const [url, setUrl] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [titleVideo, setTitleVideo] = useState<Video | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isWorking) return

    const parsed = parseYouTubeUrl(url)
    if (!parsed) {
      setError(
        'Paste a valid YouTube link — watch, youtu.be, Shorts, live, or embed.',
      )
      setNotice(null)
      return
    }

    setIsWorking(true)
    setError(null)
    setNotice(null)

    try {
      const existing = await getVideo(parsed.videoId)
      if (existing && !existing.deletedAt) {
        const flash = `“${existing.title}” is already saved.`
        setNotice(flash)
        navigate(`/videos/${existing.id}`, { state: { flash } })
        return
      }

      const now = Date.now()
      const result = await addVideo({
        id: parsed.videoId,
        title: 'Untitled video',
        channel: 'Unknown channel',
        thumbnailUrl: thumbnailFor(parsed.videoId),
        lastPositionSec: 0,
        embeddable: true,
        tags: [],
        addedAt: now,
        lastOpenedAt: now,
        updatedAt: now,
      })

      setUrl('')
      setTitleVideo(null)
      setNotice('Video saved. Looking up the title and channel…')
      onChanged()

      const metadata = await fetchYouTubeMetadata(parsed.videoId)
      if (!metadata) {
        setTitleVideo(result.video)
        setTitleDraft('')
        setNotice(
          'Video saved, but YouTube did not share its title. Add one below.',
        )
        return
      }

      await updateVideo(parsed.videoId, {
        title: metadata.title,
        channel: metadata.channel,
      })
      setNotice(`Added “${metadata.title}”.`)
      onChanged()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this video.',
      )
    } finally {
      setIsWorking(false)
    }
  }

  const handleTitleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!titleVideo || isWorking) return

    const title = titleDraft.trim()
    if (!title) return

    setIsWorking(true)
    setError(null)

    try {
      const updated = await updateVideo(titleVideo.id, { title })
      if (!updated) {
        setError('This video is no longer in your library.')
        return
      }

      setTitleVideo(null)
      setNotice(`Title saved as “${title}”.`)
      onChanged()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this title.',
      )
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="rounded-3xl border border-primary/10 bg-surface-container-lowest/90 p-4 shadow-card sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={urlId} className="text-xs font-bold text-matcha-forest">
          Add a YouTube video
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon
              name="link"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-matcha-sage"
            />
            <input
              id={urlId}
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste a YouTube link…"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={inputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={isWorking}
            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            <Icon name={isWorking ? 'progress_activity' : 'add'} className="text-lg" />
            {isWorking ? 'Adding…' : 'Add video'}
          </button>
        </div>
        <p className="text-xs text-matcha-sage">
          Works with watch, youtu.be, Shorts, live, and embed links. No API key
          needed.
        </p>
      </form>

      <div aria-live="polite" className="empty:hidden">
        {notice ? (
          <p
            role="status"
            className="mt-3 rounded-2xl bg-matcha-foam px-3.5 py-2 text-xs font-semibold text-primary"
          >
            {notice}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-2xl bg-error-container px-3.5 py-2 text-xs font-semibold text-on-error-container"
        >
          {error}
        </p>
      ) : null}

      {titleVideo ? (
        <form
          onSubmit={handleTitleSubmit}
          className="mt-3 flex flex-col gap-2 rounded-2xl border border-primary/10 bg-surface-container-low p-3"
        >
          <label htmlFor={titleId} className="text-xs font-bold text-matcha-forest">
            Video title
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={titleId}
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="e.g. System design interview"
              autoFocus
              className="w-full rounded-xl border border-primary/10 bg-surface-container-lowest px-3.5 py-2 text-sm text-matcha-forest transition-colors placeholder:text-matcha-sage/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={isWorking || !titleDraft.trim()}
              className="focus-ring rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save title
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setTitleVideo(null)
              setNotice('Saved. You can open it from the list below.')
            }}
            className="focus-ring self-start rounded text-xs font-semibold text-matcha-sage transition-colors hover:text-matcha-forest"
          >
            Skip for now
          </button>
        </form>
      ) : null}
    </div>
  )
}
