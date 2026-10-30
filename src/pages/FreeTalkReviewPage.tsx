import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Icon from '../components/Icon'
import Pill from '../components/Pill'
import {
  getSpeakingAudio,
  getSpeakingSession,
  updateSpeakingSession,
} from '../data/speakingRepository'
import ReviewPanel from '../features/free-talk/ReviewPanel'
import { reviewSpeaking } from '../features/free-talk/reviewSpeaking'
import type { SpeakingSession } from '../features/free-talk/types'

export default function FreeTalkReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SpeakingSession | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true
    let objectUrl: string | null = null

    const load = async () => {
      try {
        const saved = await getSpeakingSession(id)
        if (!active) return
        setSession(saved ?? null)
        setError(saved ? null : 'This free talk could not be found.')

        if (saved) {
          const audio = await getSpeakingAudio(saved.audioId)
          if (active && audio) {
            objectUrl = URL.createObjectURL(audio.blob)
            setAudioUrl(objectUrl)
          }
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load this free talk.',
          )
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  const retryReview = async () => {
    if (!session) return

    setIsReviewing(true)
    setError(null)

    try {
      const review = await reviewSpeaking({
        transcript: session.transcript,
        topic: session.topic,
        level: session.level,
        focus: session.focus,
        durationMs: session.audioDurationMs,
      })
      const reviewed = { ...session, review }
      await updateSpeakingSession(reviewed)
      setSession(reviewed)
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Could not generate a review.',
      )
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header subtitle="Free Talk review" />

      <main className="flex-1 pt-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/speak"
              className="focus-ring inline-flex items-center gap-1 rounded-full text-sm font-semibold text-matcha-sage hover:text-primary"
            >
              <Icon name="arrow_back" className="text-base" />
              Back to Free Talk
            </Link>
            <Pill tone="primary">Saved review</Pill>
          </div>

          {isLoading ? (
            <p className="text-sm font-semibold text-matcha-sage">
              Loading free talk…
            </p>
          ) : session ? (
            <ReviewPanel
              session={session}
              review={session.review}
              audioUrl={audioUrl}
              error={error}
              isReviewing={isReviewing}
              onRetryReview={retryReview}
              onTryAgain={() => navigate('/speak')}
              onNewTopic={() => navigate('/speak')}
            />
          ) : (
            <div className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 text-center shadow-card">
              <p className="text-sm font-bold text-matcha-forest">
                Free talk not found
              </p>
              <p className="mt-1 text-xs text-matcha-sage">
                {error ?? 'It may have been deleted from this browser.'}
              </p>
              <Link
                to="/speak"
                className="focus-ring mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
              >
                Start a new free talk
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
