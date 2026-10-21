type RoundTrackerProps = {
  round: number
  totalRounds: number
}

export default function RoundTracker({
  round,
  totalRounds,
}: RoundTrackerProps) {
  const rounds = Array.from({ length: totalRounds }, (_, index) => index + 1)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-fixed/50 bg-matcha-foam/70 px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant md:text-sm">
        <span aria-hidden="true" className="text-base">
          🍵
        </span>
        <span>
          <strong className="font-bold text-primary">Subconscious Loop:</strong>{' '}
          Round{' '}
          <span className="rounded-full bg-primary-fixed/80 px-2 py-0.5 font-extrabold text-primary">
            {round} of {totalRounds}
          </span>{' '}
          — getting smooth like silk!
        </span>
      </div>

      <div
        role="img"
        aria-label={`Round ${round} of ${totalRounds}`}
        className="flex items-center gap-1.5"
      >
        {rounds.map((value) => {
          const isComplete = value < round
          const isCurrent = value === round

          return (
            <span
              key={value}
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isComplete
                  ? 'bg-primary'
                  : isCurrent
                    ? 'animate-pulse bg-primary ring-2 ring-primary-fixed'
                    : 'bg-surface-container-highest'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
