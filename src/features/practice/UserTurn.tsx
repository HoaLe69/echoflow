import type { ReactNode } from 'react'
import Icon from '../../components/Icon'
import type { Turn } from '../../types/scenario'
import type { TranscriptMode } from './types'

type UserTurnProps = {
  turn: Turn
  roleLabel: string
  mode: TranscriptMode
  step: number
  totalSteps: number
  isHintOpen: boolean
  onToggleHint: () => void
  onListenReference: () => void
  onBreakdown: () => void
  /** Words rendered with emphasis in full mode and kept visible in blur mode. */
  highlightWords?: readonly string[]
  /** Index of the IPA chip to visually emphasise. */
  highlightIpaIndex?: number
  /** Pattern clue and feedback are composed by the page. */
  children?: ReactNode
}

function isHighlighted(word: string, highlightWords: readonly string[]) {
  const clean = word.toLowerCase().replace(/[^a-z']/g, '')
  return highlightWords.some((highlight) => clean === highlight.toLowerCase())
}

export default function UserTurn({
  turn,
  roleLabel,
  mode,
  step,
  totalSteps,
  isHintOpen,
  onToggleHint,
  onListenReference,
  onBreakdown,
  highlightWords = [],
  highlightIpaIndex,
  children,
}: UserTurnProps) {
  const words = turn.text.split(' ')
  const ipaChips = turn.ipa
    ?.split('|')
    .map((chip) => chip.trim())
    .filter(Boolean)

  return (
    <article className="relative flex w-full flex-col gap-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-3xl bg-primary-fixed/30 blur-lg"
      />

      <div className="relative z-10 flex items-center justify-between gap-2 px-2">
        <span className="text-xs font-medium text-outline">
          Step {step} of {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-0.5 text-xs font-bold text-primary shadow-sm">
            <Icon name="record_voice_over" className="text-xs" />
            YOUR TURN TO SPEAK
          </span>
          <span className="text-xs font-bold text-matcha-forest">
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="relative z-10 rounded-3xl rounded-tr-sm border-2 border-primary-fixed-dim/60 bg-surface-container-lowest p-5 shadow-[0_8px_24px_rgba(51,83,49,0.08)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-surface-container pb-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-shrink-0 animate-ping rounded-full bg-primary"
            />
            <span className="flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-primary">
              Ready to Speak
              <span className="hidden font-normal lowercase text-outline sm:inline">
                (no overthinking!)
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleHint}
            aria-expanded={isHintOpen}
            aria-pressed={isHintOpen}
            className="focus-ring inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-mochi-blush px-2.5 py-1 text-xs font-semibold text-tertiary transition-colors hover:bg-tertiary-fixed"
          >
            <Icon name="lightbulb" className="text-xs" />
            {isHintOpen ? 'Hide Pattern' : 'Show Pattern Clue'}
          </button>
        </div>

        <div className="min-h-[4.5rem] py-1">
          {mode === 'full' ? (
            <div>
              <p className="font-headline text-lg font-bold leading-relaxed tracking-normal text-matcha-forest sm:text-2xl">
                “
                {words.map((word, index) => {
                  const emphasized = isHighlighted(word, highlightWords)

                  return (
                    <span
                      key={`${word}-${index}`}
                      className={`cursor-pointer rounded-xl px-1.5 py-0.5 transition-colors hover:bg-primary-fixed/40 ${
                        emphasized
                          ? 'font-extrabold text-primary underline decoration-primary/40 underline-offset-4'
                          : ''
                      }`}
                    >
                      {word}
                      {index < words.length - 1 ? ' ' : ''}
                    </span>
                  )
                })}
                ”
              </p>

              {ipaChips && ipaChips.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-outline">
                  {ipaChips.map((chip, index) => (
                    <span
                      key={`${chip}-${index}`}
                      className={`rounded-full px-2.5 py-0.5 text-matcha-forest ${
                        index === highlightIpaIndex
                          ? 'bg-primary-fixed/70 font-bold'
                          : 'bg-surface-container'
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === 'blur' ? (
            <div>
              <p className="font-headline text-lg font-bold leading-relaxed tracking-normal text-matcha-forest sm:text-2xl">
                “
                {words.map((word, index) => {
                  const emphasized = isHighlighted(word, highlightWords)
                  const separator = index < words.length - 1 ? ' ' : ''

                  if (emphasized) {
                    return (
                      <span key={`${word}-${index}`}>
                        <strong className="text-primary underline decoration-2 decoration-primary-fixed-dim">
                          {word}
                        </strong>
                        {separator}
                      </span>
                    )
                  }

                  return (
                    <span key={`${word}-${index}`}>
                      <span className="select-none rounded bg-surface-container-high px-2 text-transparent blur-sm">
                        {word}
                      </span>
                      {separator}
                    </span>
                  )
                })}
                ”
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs italic text-on-surface-variant">
                <span aria-hidden="true">💡</span>
                Fill in the blurred blanks from auditory reflex memory.
              </p>
            </div>
          ) : null}

          {mode === 'blind' ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-primary-fixed/60 bg-matcha-foam/60 p-4 text-center">
              <span aria-hidden="true" className="mb-1 text-2xl">
                🍵✨
              </span>
              <h4 className="font-headline text-base font-bold text-matcha-forest">
                Pure Automaticity Reflex Mode
              </h4>
              <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
                Text is tucked away. Breathe, picture the scene, and answer
                naturally!
              </p>
            </div>
          ) : null}
        </div>

        {children}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container pt-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onListenReference}
              className="focus-ring inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-semibold text-primary transition-colors hover:text-matcha-forest"
            >
              <Icon name="headset" className="text-sm" />
              Listen Reference
            </button>
            <button
              type="button"
              onClick={onBreakdown}
              className="focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-outline transition-colors hover:text-primary"
            >
              <Icon name="slow_motion_video" className="text-sm" />
              0.8x Breakdown
            </button>
          </div>
          <span className="flex items-center gap-1 text-outline">
            <kbd className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px]">
              Space
            </kbd>
            to record voice
          </span>
        </div>
      </div>
    </article>
  )
}
