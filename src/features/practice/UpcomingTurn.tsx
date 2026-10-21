type UpcomingTurnProps = {
  side: 'partner' | 'user'
  name: string
  label: string
  text: string
}

export default function UpcomingTurn({
  side,
  name,
  label,
  text,
}: UpcomingTurnProps) {
  const isPartner = side === 'partner'

  return (
    <article
      className={`flex w-full flex-col gap-2 transition-opacity ${
        isPartner ? 'opacity-70 hover:opacity-100' : 'opacity-50 hover:opacity-80'
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          isPartner ? '' : 'justify-end'
        }`}
      >
        {isPartner ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-primary">
            {name.charAt(0)}
          </div>
        ) : null}
        {isPartner ? (
          <span className="text-xs font-semibold text-on-surface-variant">
            {name}
          </span>
        ) : null}
        <span className="text-xs text-outline">{label}</span>
        {!isPartner ? (
          <span className="text-xs font-semibold text-on-surface-variant">
            {name}
          </span>
        ) : null}
      </div>

      <div
        className={`border border-surface-container bg-surface-container-low p-4 sm:p-5 ${
          isPartner
            ? 'rounded-3xl rounded-tl-sm'
            : 'rounded-3xl rounded-tr-sm'
        }`}
      >
        <p className="font-headline text-sm leading-relaxed text-on-surface-variant sm:text-base">
          “{text}”
        </p>
      </div>
    </article>
  )
}
