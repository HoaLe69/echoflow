import Icon from '../../components/Icon'

type FeedbackBoxProps = {
  score: number
  message: string
  detail?: string
  feedbackMessage?: string
}

export default function FeedbackBox({
  score,
  message,
  detail,
  feedbackMessage,
}: FeedbackBoxProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary-fixed/40 bg-matcha-foam/50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`Pronunciation score ${score} percent`}
          className="relative h-11 w-11 flex-shrink-0"
        >
          <svg
            viewBox="0 0 36 36"
            aria-hidden="true"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              strokeWidth="3"
              className="stroke-surface-container-highest"
            />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${score}, 100`}
              className="stroke-primary"
            />
          </svg>
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary"
          >
            {score}%
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            {message}
            <Icon name="verified" className="text-xs" />
          </div>
          {detail ? (
            <p className="truncate text-xs text-on-surface-variant">{detail}</p>
          ) : null}
        </div>
      </div>

      {feedbackMessage ? (
        <div className="flex items-center gap-1.5 self-start rounded-full border border-primary-fixed bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-primary shadow-sm sm:self-auto">
          <span aria-hidden="true">✨</span>
          <span>{feedbackMessage}</span>
        </div>
      ) : null}
    </div>
  )
}
