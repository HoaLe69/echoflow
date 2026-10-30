import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Icon from '../components/Icon'
import Pill from '../components/Pill'
import { listSpeakingSessions } from '../data/speakingRepository'
import ProviderMenu from '../features/audio-import/components/ProviderMenu'
import ReviewPanel from '../features/free-talk/ReviewPanel'
import {
  freeTalkCategories,
  freeTalkTopics,
  pickRandomTopic,
} from '../features/free-talk/topics'
import type {
  FreeTalkFocus,
  FreeTalkTopic,
  SpeakingSession,
} from '../features/free-talk/types'
import { useFreeTalkSession } from '../features/free-talk/useFreeTalkSession'
import type { Level } from '../types/scenario'

const durations = [
  { label: '2 min', value: 2 * 60_000 },
  { label: '3 min', value: 3 * 60_000 },
]

const focusOptions: Array<{ value: FreeTalkFocus; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
]

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(totalSeconds / 60)}:${String(
    totalSeconds % 60,
  ).padStart(2, '0')}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export default function FreeTalkPage() {
  const session = useFreeTalkSession()
  const [category, setCategory] = useState('All')
  const [selectedTopicId, setSelectedTopicId] = useState(
    freeTalkTopics[0]?.id ?? '',
  )
  const [customTopic, setCustomTopic] = useState('')
  const [level, setLevel] = useState<Level>('b1')
  const [focus, setFocus] = useState<FreeTalkFocus>('balanced')
  const [targetDurationMs, setTargetDurationMs] = useState(durations[0].value)
  const [history, setHistory] = useState<SpeakingSession[]>([])

  const categories = ['All', ...freeTalkCategories]
  const visibleTopics = useMemo(
    () =>
      category === 'All'
        ? freeTalkTopics
        : freeTalkTopics.filter((topic) => topic.category === category),
    [category],
  )
  const selectedTopic =
    freeTalkTopics.find((topic) => topic.id === selectedTopicId) ??
    visibleTopics[0] ??
    freeTalkTopics[0]

  const activeTopic = customTopic.trim() || selectedTopic.prompt
  const activeCategory = customTopic.trim() ? 'Custom' : selectedTopic.category
  const progress = session.config
    ? Math.min(100, (session.elapsedMs / session.config.targetDurationMs) * 100)
    : 0

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await listSpeakingSessions())
    } catch {
      // History is optional; the recorder still works without IndexedDB.
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void refreshHistory()
  }, [refreshHistory])

  useEffect(() => {
    if (session.stage === 'review' && session.sessionId) {
      // oxlint-disable-next-line react/set-state-in-effect
      void refreshHistory()
    }
  }, [refreshHistory, session.sessionId, session.stage])

  const reviewSession: SpeakingSession | null = session.config
    ? {
        id: session.sessionId ?? 'draft',
        topic: session.config.topic,
        category: session.config.category,
        level: session.config.level,
        focus: session.config.focus,
        targetDurationMs: session.config.targetDurationMs,
        audioDurationMs: session.durationMs,
        audioId: '',
        transcript: session.transcript,
        transcriptProvider: session.providerId,
        review: session.review,
        createdAt: 0,
      }
    : null

  const selectTopic = (topic: FreeTalkTopic) => {
    setSelectedTopicId(topic.id)
    setCustomTopic('')
    setLevel(topic.suggestedLevel)
  }

  const surpriseMe = () => {
    const topic = pickRandomTopic(selectedTopicId)
    setCategory(topic.category)
    setSelectedTopicId(topic.id)
    setCustomTopic('')
    setLevel(topic.suggestedLevel)
  }

  const start = () => {
    if (!activeTopic.trim()) return
    void session.start({
      topic: activeTopic.trim(),
      category: activeCategory,
      level,
      focus,
      targetDurationMs,
    })
  }

  const resetToSetup = () => {
    session.reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startNewTopic = () => {
    session.reset()
    const topic = pickRandomTopic(selectedTopicId)
    setCategory(topic.category)
    setSelectedTopicId(topic.id)
    setCustomTopic('')
    setLevel(topic.suggestedLevel)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header subtitle="Free Talk" />

      <main className="flex-1 pt-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="focus-ring inline-flex items-center gap-1 rounded-full text-sm font-semibold text-matcha-sage hover:text-primary"
            >
              <Icon name="arrow_back" className="text-base" />
              Back to library
            </Link>
            <Pill tone="primary">Free Talk</Pill>
          </div>

          {session.stage === 'setup' ? (
            <>
              <section>
                <h1 className="font-headline text-2xl font-extrabold text-matcha-forest">
                  Speak freely. Then see how you did.
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-matcha-sage">
                  Pick a topic, talk for 2–3 minutes, and get a corrected
                  transcript plus focused feedback from Gemini.
                </p>
              </section>

              <section className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-matcha-forest">
                    Choose a topic
                  </h2>
                  <button
                    type="button"
                    onClick={surpriseMe}
                    className="focus-ring inline-flex items-center gap-1 rounded-full bg-matcha-foam px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary-fixed"
                  >
                    <Icon name="shuffle" className="text-sm" />
                    Surprise me
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCategory(item)
                        const first =
                          item === 'All'
                            ? freeTalkTopics[0]
                            : freeTalkTopics.find(
                                (topic) => topic.category === item,
                              )
                        if (first) selectTopic(first)
                      }}
                      className={`focus-ring rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        category === item
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-matcha-sage hover:bg-matcha-foam'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  {visibleTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => selectTopic(topic)}
                      className={`focus-ring rounded-2xl border p-3 text-left transition-colors ${
                        selectedTopic.id === topic.id && !customTopic
                          ? 'border-primary/40 bg-matcha-foam/70'
                          : 'border-primary/10 bg-surface-container-low hover:bg-matcha-foam/40'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide text-outline">
                        {topic.category}
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-relaxed text-matcha-forest">
                        {topic.prompt}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-matcha-forest">
                    Or write your own topic
                  </span>
                  <input
                    value={customTopic}
                    onChange={(event) => setCustomTopic(event.target.value)}
                    placeholder="e.g. Describe a lesson you learned from a friend"
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-xs text-matcha-forest placeholder:text-matcha-sage/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </section>

              <section className="grid grid-cols-1 gap-4 rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-matcha-forest">
                    Duration
                  </span>
                  <div className="flex gap-2">
                    {durations.map((duration) => (
                      <button
                        key={duration.value}
                        type="button"
                        onClick={() => setTargetDurationMs(duration.value)}
                        className={`focus-ring flex-1 rounded-full px-3 py-2 text-xs font-bold ${
                          targetDurationMs === duration.value
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-matcha-sage'
                        }`}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-matcha-forest">
                    Level
                  </span>
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value as Level)}
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-xs text-matcha-forest"
                  >
                    <option value="a1-a2">A2 — simple</option>
                    <option value="b1">B1 — everyday</option>
                    <option value="b2">B2 — confident</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-matcha-forest">
                    Review focus
                  </span>
                  <select
                    value={focus}
                    onChange={(event) =>
                      setFocus(event.target.value as FreeTalkFocus)
                    }
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-xs text-matcha-forest"
                  >
                    {focusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="sm:col-span-2">
                  <ProviderMenu
                    value={session.providerId}
                    onChange={session.setProviderId}
                  />
                </div>

                <div className="sm:col-span-2">
                  {session.error ? (
                    <p
                      role="alert"
                      className="mb-2 rounded-xl bg-error-container px-3 py-2 text-xs font-medium text-on-error-container"
                    >
                      {session.error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={start}
                    disabled={!activeTopic.trim() || !session.isSupported}
                    className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="mic" className="text-lg" />
                    Start speaking
                  </button>
                  {!session.isSupported ? (
                    <p className="mt-2 text-xs text-error">
                      This browser cannot record audio.
                    </p>
                  ) : null}
                </div>
              </section>

              {history.length > 0 ? (
                <section className="flex flex-col gap-3 rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-matcha-forest">
                      Recent free talks
                    </h2>
                    <span className="text-[11px] text-outline">
                      {history.length} saved
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {history.slice(0, 5).map((item) => (
                      <Link
                        key={item.id}
                        to={`/speak/${item.id}`}
                        className="focus-ring flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-3 transition-colors hover:bg-matcha-foam/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-matcha-forest">
                            {item.topic}
                          </p>
                          <p className="mt-0.5 text-[10px] text-outline">
                            {formatDate(item.createdAt)} ·{' '}
                            {formatClock(item.audioDurationMs)}
                          </p>
                        </div>
                        <Pill tone={item.review ? 'primary' : 'neutral'}>
                          {item.review ? `${item.review.scores.overall}` : '—'}
                        </Pill>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {session.stage === 'recording' && session.config ? (
            <section className="flex flex-col gap-6 rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 text-center shadow-card">
              <Pill tone="primary">{session.config.category}</Pill>
              <h1 className="font-headline text-xl font-bold leading-snug text-matcha-forest">
                {session.config.topic}
              </h1>

              <div className="flex flex-col items-center gap-2">
                <div className="font-headline text-6xl font-extrabold tracking-tight text-primary">
                  {formatClock(session.elapsedMs)}
                </div>
                <p className="text-xs font-semibold text-matcha-sage">
                  Target {formatClock(session.config.targetDurationMs)}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex h-16 items-end justify-center gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                  <span
                    key={bar}
                    className="w-2 animate-pulse rounded-full bg-primary/50"
                    style={{
                      height: `${18 + ((bar * 17) % 42)}px`,
                      animationDelay: `${bar * 90}ms`,
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={session.stop}
                className="focus-ring mx-auto flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99]"
              >
                <Icon name="stop_circle" className="text-lg" />
                Stop recording
              </button>
              <p className="text-[11px] text-outline">
                The recording stops automatically at the target.
              </p>
            </section>
          ) : null}

          {session.stage === 'processing' && session.config ? (
            <section className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 shadow-card">
              <Pill tone="primary">{session.config.category}</Pill>
              <h1 className="font-headline text-xl font-bold text-matcha-forest">
                {session.config.topic}
              </h1>
              {session.audioUrl ? (
                <audio controls src={session.audioUrl} className="w-full" />
              ) : null}

              {!session.transcript ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-2">
                    <Icon
                      name="graphic_eq"
                      className="mt-0.5 text-base text-primary"
                    />
                    <div>
                      <p className="text-xs font-bold text-matcha-forest">
                        Audio ready
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-matcha-sage">
                        Get the transcript first. Nothing is sent to Gemini
                        until you ask for the review.
                      </p>
                    </div>
                  </div>

                  {session.isTranscribing ? (
                    <div className="flex flex-col gap-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${session.transcriptionProgress}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-primary">
                        Transcribing… {session.transcriptionProgress}%
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void session.transcribe()}
                      disabled={!session.audioBlob}
                      className="focus-ring w-fit rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50"
                    >
                      {session.error
                        ? 'Try transcript again'
                        : 'Get transcript'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-primary/10 bg-surface-container-low p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
                      Transcript
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-matcha-forest">
                      {session.transcript}
                    </p>
                  </div>

                  {session.isReviewing ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-3 text-xs font-semibold text-primary">
                      <Icon
                        name="hourglass_top"
                        className="animate-pulse text-base"
                      />
                      Reviewing with Gemini…
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void session.generateReview()}
                      className="focus-ring w-fit rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
                    >
                      {session.error
                        ? 'Try review again'
                        : 'Review with Gemini'}
                    </button>
                  )}
                </div>
              )}

              {session.error ? (
                <p role="alert" className="text-xs font-medium text-error">
                  {session.error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetToSetup}
                  disabled={session.isTranscribing || session.isReviewing}
                  className="focus-ring rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-matcha-sage disabled:opacity-40"
                >
                  Start over
                </button>
              </div>
            </section>
          ) : null}

          {session.stage === 'review' && reviewSession ? (
            <ReviewPanel
              session={reviewSession}
              review={session.review}
              audioUrl={session.audioUrl}
              error={session.error}
              isReviewing={session.isReviewing}
              onRetryReview={session.generateReview}
              onTryAgain={resetToSetup}
              onNewTopic={startNewTopic}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}
