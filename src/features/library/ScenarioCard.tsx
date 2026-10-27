import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import type { PillTone } from '../../components/Pill'
import type { Level, Progress, Scenario, Turn } from '../../types/scenario'

const levelCopy: Record<
  Level,
  { emoji: string; label: string; tone: PillTone }
> = {
  'a1-a2': { emoji: '🌱', label: 'A2 Beginner', tone: 'primary' },
  b1: { emoji: '🍵', label: 'B1 Everyday', tone: 'primary-fixed' },
  b2: { emoji: '💼', label: 'B2 Pro', tone: 'neutral' },
}

type ScenarioCardProps = {
  scenario: Scenario
  progress: Progress
  /** Optional display line for the bottom-right of the progress block. */
  note?: string
  onStart: () => void
  onPreviewScript: () => void
  onToggleFavorite: () => void
  /** Imported scenarios only. */
  onDelete?: () => void
  isDeleting?: boolean
}

function firstLearnerTurn(turns: Turn[]): Turn | undefined {
  return turns.find((turn) => turn.speaker === 0) ?? turns[0]
}

function fallbackNote(progress: Progress, isNew: boolean): string {
  if (isNew) return 'Est. 4 mins'
  if (progress.reps >= 10) return 'Ready for Live Call ✨'
  if (progress.reps >= 5) return 'Rhythm steady'
  return 'Next: Practice Speaker B'
}

export default function ScenarioCard({
  scenario,
  progress,
  note,
  onStart,
  onPreviewScript,
  onToggleFavorite,
  onDelete,
  isDeleting = false,
}: ScenarioCardProps) {
  const level = levelCopy[scenario.level]
  const preview = firstLearnerTurn(scenario.turns)
  const isNew = progress.reps === 0 && progress.fluencyScore === undefined
  const score = progress.fluencyScore
  const barValue = isNew ? 15 : (score ?? 0)
  const metricLabel = isNew ? 'Status' : 'Fluency Score'
  const metricValue = isNew
    ? 'Fresh Scenario 🍵'
    : score !== undefined
      ? `${score}%`
      : '—'
  const progressNote = note ?? fallbackNote(progress, isNew)
  const ipa = preview?.ipa?.replace(/\s*\|\s*/g, ' ')

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={level.tone}>
            <span aria-hidden="true">{level.emoji}</span>
            {level.label}
          </Pill>
          <Pill>{scenario.turns.length} Turns</Pill>
          <Pill>{scenario.topic}</Pill>
          {scenario.kind === 'imported' ? (
            <Pill tone="blush">Imported audio</Pill>
          ) : null}
        </div>
        <div className="-mr-1 -mt-1 flex items-center gap-0.5">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete imported scenario"
              className="focus-ring rounded-full p-1 text-outline/50 transition-colors hover:text-error disabled:opacity-40"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={progress.favorite}
            aria-label={
              progress.favorite ? 'Remove from favorites' : 'Add to favorites'
            }
            className={`focus-ring rounded-full p-1 transition-colors ${
              progress.favorite
                ? 'text-tertiary'
                : 'text-outline/50 hover:text-tertiary'
            }`}
          >
            <Icon
              name="favorite"
              filled={progress.favorite}
              className="text-lg"
            />
          </button>
        </div>
      </div>

      <h3 className="font-headline text-lg font-bold leading-snug text-matcha-forest transition-colors group-hover:text-primary">
        {scenario.title}
      </h3>

      {scenario.goal ? (
        <p className="mt-1 text-xs font-semibold text-hojicha">
          🎯 Goal: {scenario.goal}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-matcha-sage">
        <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-semibold text-matcha-forest">
          You: {scenario.roles[0]}
        </span>
        <span aria-hidden="true" className="text-outline-variant">
          ⇄
        </span>
        <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-medium text-matcha-forest">
          {scenario.roles[1]}
        </span>
      </div>

      {preview ? (
        <div className="mt-3 flex flex-col gap-1 rounded-2xl border border-primary/5 bg-surface-container-low/70 p-3.5">
          <div className="flex items-center justify-between text-matcha-sage">
            <span className="text-xs font-bold text-primary">
              Turn 1 / {scenario.turns.length}
            </span>
            <Icon name="volume_up" className="text-sm" />
          </div>
          <p className="text-sm font-medium italic text-matcha-forest">
            “{preview.text}”
          </p>
          {ipa ? (
            <p
              title={ipa}
              className="truncate font-mono text-xs text-matcha-sage/80"
            >
              {ipa}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-matcha-sage">{metricLabel}</span>
          <span className="font-extrabold text-primary">{metricValue}</span>
        </div>
        <div
          role="progressbar"
          aria-label={metricLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barValue}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isNew ? 'bg-outline-variant/60' : 'bg-primary'
            }`}
            style={{ width: `${barValue}%` }}
          />
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-matcha-sage">
          <span>
            {isNew ? '0 loops completed' : `${progress.reps} reps completed`}
          </span>
          <span
            className={`text-right ${
              isNew ? '' : 'font-semibold text-primary'
            }`}
          >
            {progressNote}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={onStart}
          className={`focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 ${
            isNew
              ? 'bg-hojicha text-on-secondary hover:bg-hojicha/90'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          }`}
        >
          {isNew ? 'Start First Loop' : 'Start Loop'}
          <Icon name={isNew ? 'play_arrow' : 'arrow_forward'} className="text-base" />
        </button>
        <button
          type="button"
          onClick={onPreviewScript}
          className="focus-ring rounded-full bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-matcha-forest transition-colors hover:bg-surface-container-high"
        >
          Script
        </button>
      </div>
    </article>
  )
}
