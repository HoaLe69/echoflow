import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import type {
  SpeakingReview,
  SpeakingSession,
} from './types'

type ReviewPanelProps = {
  session: SpeakingSession
  review: SpeakingReview | null
  audioUrl: string | null
  error?: string | null
  isReviewing?: boolean
  onRetryReview?: () => void
  onTryAgain?: () => void
  onNewTopic?: () => void
}

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(totalSeconds / 60)}:${String(
    totalSeconds % 60,
  ).padStart(2, '0')}`
}

function scoreTone(score: number): string {
  if (score >= 85) return 'bg-primary'
  if (score >= 70) return 'bg-hojicha'
  return 'bg-tertiary'
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-matcha-sage">{label}</span>
        <span className="font-bold text-primary">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className={`h-full rounded-full ${scoreTone(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function ReviewPanel({
  session,
  review,
  audioUrl,
  error,
  isReviewing = false,
  onRetryReview,
  onTryAgain,
  onNewTopic,
}: ReviewPanelProps) {
  const words = session.transcript.trim().split(/\s+/).filter(Boolean)
  const minutes = session.audioDurationMs / 60_000
  const wpm = minutes > 0 ? Math.round(words.length / minutes) : 0
  const fillerCount = (
    session.transcript.match(
      /\b(um+|uh+|like|you know|actually|basically|so)\b/gi,
    ) ?? []
  ).length

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Pill tone="primary">{session.category}</Pill>
            <h1 className="mt-2 font-headline text-xl font-extrabold text-matcha-forest">
              {session.topic}
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-outline">
              {formatClock(session.audioDurationMs)} · {words.length} words ·{' '}
              {wpm} wpm · {fillerCount} fillers
            </p>
          </div>
          <Pill tone="neutral">
            {session.level === 'a1-a2'
              ? 'A2'
              : session.level === 'b1'
                ? 'B1'
                : 'B2'}
          </Pill>
        </div>

        {audioUrl ? (
          <audio
            controls
            src={audioUrl}
            className="mt-4 w-full"
            aria-label="Your free talk recording"
          />
        ) : null}
      </section>

      {!review ? (
        <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-matcha-foam text-primary">
              <Icon
                name={isReviewing ? 'hourglass_top' : 'rate_review'}
                className="text-lg"
              />
            </span>
            <div>
              <h2 className="text-sm font-bold text-matcha-forest">
                {isReviewing
                  ? 'Preparing your review…'
                  : error
                    ? 'Review unavailable'
                    : 'Transcript ready'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-matcha-sage">
                {isReviewing
                  ? 'Gemini is reading your transcript. This usually takes a few seconds.'
                  : error ??
                    'The transcript is saved. Generate the review when you are ready.'}
              </p>
            </div>
          </div>

          {onRetryReview && !isReviewing ? (
            <button
              type="button"
              onClick={() => void onRetryReview()}
              className="focus-ring mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
            >
              Retry review
            </button>
          ) : null}

          <details className="mt-4 rounded-2xl border border-primary/10 bg-surface-container-low p-3">
            <summary className="cursor-pointer text-xs font-bold text-matcha-forest">
              Original transcript
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-matcha-forest">
              {session.transcript}
            </p>
          </details>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card sm:grid-cols-5">
            <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl bg-matcha-foam p-3 text-center sm:col-span-1">
              <span className="font-headline text-3xl font-extrabold text-primary">
                {review.scores.overall}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-matcha-sage">
                Overall
              </span>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:col-span-4">
              <ScoreBar label="Grammar" value={review.scores.grammar} />
              <ScoreBar label="Vocabulary" value={review.scores.vocabulary} />
              <ScoreBar label="Coherence" value={review.scores.coherence} />
              <ScoreBar label="Fluency" value={review.scores.fluency} />
            </div>
          </section>

          <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
            <h2 className="text-sm font-bold text-matcha-forest">Summary</h2>
            <p className="mt-2 text-xs leading-relaxed text-matcha-sage">
              {review.summary}
            </p>
          </section>

          <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-matcha-forest">
                Corrected version
              </h2>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    review.correctedTranscript,
                  )
                }}
                className="focus-ring rounded-full px-2 py-1 text-[10px] font-bold text-primary hover:bg-matcha-foam"
              >
                Copy
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-matcha-forest">
              {review.correctedTranscript}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
              <h2 className="text-sm font-bold text-matcha-forest">
                What worked
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {review.strengths.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-matcha-sage"
                  >
                    <Icon
                      name="check_circle"
                      className="mt-0.5 text-sm text-primary"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
              <h2 className="text-sm font-bold text-matcha-forest">
                What to improve
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {review.improvements.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-matcha-sage"
                  >
                    <Icon
                      name="arrow_circle_right"
                      className="mt-0.5 text-sm text-hojicha"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {review.corrections.length > 0 ? (
            <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
              <h2 className="text-sm font-bold text-matcha-forest">
                Key corrections
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {review.corrections.map((correction, index) => (
                  <div
                    key={`${correction.original}-${index}`}
                    className="rounded-2xl bg-surface-container-low p-3"
                  >
                    <p className="text-xs text-matcha-sage line-through">
                      {correction.original}
                    </p>
                    <p className="mt-1 text-xs font-bold text-primary">
                      {correction.corrected}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-outline">
                      {correction.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {review.vocabularyUpgrades.length > 0 ? (
            <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
              <h2 className="text-sm font-bold text-matcha-forest">
                Vocabulary upgrades
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {review.vocabularyUpgrades.map((upgrade, index) => (
                  <div
                    key={`${upgrade.original}-${index}`}
                    className="flex flex-wrap items-baseline gap-2 rounded-2xl bg-surface-container-low p-3"
                  >
                    <span className="text-xs text-matcha-sage line-through">
                      {upgrade.original}
                    </span>
                    <Icon
                      name="arrow_forward"
                      className="text-sm text-outline"
                    />
                    <span className="text-xs font-bold text-primary">
                      {upgrade.suggestion}
                    </span>
                    <span className="w-full text-[11px] text-outline">
                      {upgrade.reason}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {review.nextStep ? (
            <section className="rounded-3xl border border-hojicha/20 bg-hojicha/10 p-5">
              <h2 className="text-sm font-bold text-matcha-forest">
                Next repetition
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-matcha-forest">
                {review.nextStep}
              </p>
            </section>
          ) : null}

          <details className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card">
            <summary className="cursor-pointer text-xs font-bold text-matcha-forest">
              Original transcript
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-matcha-forest">
              {session.transcript}
            </p>
          </details>
        </>
      )}

      {error && review ? (
        <p role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {onTryAgain ? (
          <button
            type="button"
            onClick={onTryAgain}
            className="focus-ring rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-container"
          >
            Try this topic again
          </button>
        ) : null}
        {onNewTopic ? (
          <button
            type="button"
            onClick={onNewTopic}
            className="focus-ring rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 text-xs font-bold text-primary hover:bg-matcha-foam"
          >
            New topic
          </button>
        ) : null}
      </div>
    </div>
  )
}
