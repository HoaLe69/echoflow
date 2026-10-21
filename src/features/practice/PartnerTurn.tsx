import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import type { Turn } from '../../types/scenario'

type PartnerTurnProps = {
  turn: Turn
  name: string
  avatarSrc?: string
  timeLabel?: string
  speedLabel: string
  onListen: () => void
}

export default function PartnerTurn({
  turn,
  name,
  avatarSrc,
  timeLabel = '0:04',
  speedLabel,
  onListen,
}: PartnerTurnProps) {
  return (
    <article className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-surface-container-high shadow-sm"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-primary"
          >
            {name.charAt(0)}
          </span>
        )}
        <span className="text-xs font-bold text-matcha-forest">{name}</span>
        <Pill className="bg-surface-container-high/80 font-semibold text-outline">
          Native Audio
        </Pill>
        <span className="ml-auto text-xs text-outline">{timeLabel}</span>
      </div>

      <div className="rounded-3xl rounded-tl-sm border border-surface-container bg-surface-container-lowest p-5 shadow-[0_2px_12px_rgba(51,83,49,0.04)] sm:p-6">
        <p className="font-headline text-base font-medium leading-relaxed text-matcha-forest sm:text-lg">
          “{turn.text}”
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container pt-2">
          <button
            type="button"
            onClick={onListen}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-matcha-foam px-3 py-1 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary-fixed/80"
          >
            <Icon name="volume_up" className="text-sm" />
            Listen Native ({speedLabel}x)
          </button>
          <div className="flex items-center gap-1 text-xs font-medium text-on-surface-variant">
            <Icon name="check_circle" className="text-sm text-primary" />
            Played • Your cue next
          </div>
        </div>
      </div>
    </article>
  )
}
