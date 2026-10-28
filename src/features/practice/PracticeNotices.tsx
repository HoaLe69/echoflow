type PracticeNoticesProps = {
  error: string | null
  isSupported: boolean
  isComplete: boolean
  totalRounds: number
}

export default function PracticeNotices({
  error,
  isSupported,
  isComplete,
  totalRounds,
}: PracticeNoticesProps) {
  const notice =
    error ??
    (isSupported
      ? null
      : 'Voice input is not available in this browser. Try Chrome or Edge.')

  return (
    <>
      {notice ? (
        <p
          role="alert"
          className="rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-xs font-medium text-on-error-container"
        >
          {notice}
        </p>
      ) : null}

      {isComplete ? (
        <div
          role="status"
          className="rounded-2xl border border-primary-fixed bg-matcha-foam px-4 py-3 text-xs font-semibold text-primary"
        >
          Loop complete — all {totalRounds} rounds finished. 🍵 Next Turn returns
          to the library.
        </div>
      ) : null}
    </>
  )
}
