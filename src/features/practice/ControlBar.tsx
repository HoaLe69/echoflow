import Icon from '../../components/Icon'
import Pill from '../../components/Pill'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import type { Level, Scenario } from '../../types/scenario'

export type TranscriptMode = 'full' | 'blur' | 'blind'
export type PlaybackSpeed = '0.8' | '1.0' | '1.2'
export type PracticeRole = 0 | 1

const levelLabels: Record<Level, string> = {
  'a1-a2': 'A2 Beginner',
  b1: 'B1 Everyday',
  b2: 'B2 Pro',
}

const transcriptOptions: readonly SegmentedOption<TranscriptMode>[] = [
  { value: 'full', label: 'Full' },
  { value: 'blur', label: 'Blur Prompt' },
  { value: 'blind', label: 'Blind Reflex' },
]

const speedOptions: readonly SegmentedOption<PlaybackSpeed>[] = [
  { value: '0.8', label: '0.8x' },
  { value: '1.0', label: '1.0x' },
  { value: '1.2', label: '1.2x' },
]

const roleIndexes = [0, 1] as const

type ControlBarProps = {
  scenario: Scenario
  role: PracticeRole
  onRoleChange: (role: PracticeRole) => void
  transcriptMode: TranscriptMode
  onTranscriptModeChange: (mode: TranscriptMode) => void
  speed: PlaybackSpeed
  onSpeedChange: (speed: PlaybackSpeed) => void
  onBack: () => void
}

export default function ControlBar({
  scenario,
  role,
  onRoleChange,
  transcriptMode,
  onTranscriptModeChange,
  speed,
  onSpeedChange,
  onBack,
}: ControlBarProps) {
  return (
    <section
      aria-label="Practice controls"
      className="sticky top-16 z-30 border-b border-surface-container-high/60 bg-surface-container-low/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to library"
            className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary transition-colors hover:bg-matcha-foam"
          >
            <Icon name="arrow_back" className="text-base" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="primary-fixed">{levelLabels[scenario.level]}</Pill>
              <span aria-hidden="true" className="text-outline-variant">
                •
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant">
                <Icon name="local_cafe" className="text-xs text-secondary" />
                {scenario.topic}
              </span>
            </div>
            <h1 className="mt-0.5 truncate font-headline text-base font-bold tracking-tight text-primary md:text-lg">
              {scenario.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full bg-surface-container p-1 text-xs font-semibold shadow-sm">
            {roleIndexes.map((index) => {
              const active = role === index

              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRoleChange(index)}
                  className={`focus-ring flex items-center gap-1 rounded-full px-3 py-1 transition-all ${
                    active
                      ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <Icon
                    name={index === 0 ? 'person' : 'record_voice_over'}
                    className="text-xs"
                  />
                  You: {scenario.roles[index]}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onRoleChange(role === 0 ? 1 : 0)}
              aria-label="Swap roles"
              className="focus-ring rounded-full px-2 py-1 text-outline transition-colors hover:text-primary"
            >
              <Icon name="sync_alt" className="text-sm" />
            </button>
          </div>

          <div className="max-w-full overflow-x-auto">
            <SegmentedControl
              label="Transcript mode"
              options={transcriptOptions}
              value={transcriptMode}
              onChange={onTranscriptModeChange}
              className="w-max"
            />
          </div>

          <SegmentedControl
            label="Playback speed"
            options={speedOptions}
            value={speed}
            onChange={onSpeedChange}
            className="hidden sm:flex"
          />

          <label className="relative sm:hidden">
            <span className="sr-only">Playback speed</span>
            <Icon
              name="speed"
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-primary"
            />
            <select
              value={speed}
              onChange={(event) =>
                onSpeedChange(event.target.value as PlaybackSpeed)
              }
              className="focus-ring appearance-none rounded-full border border-primary/10 bg-surface-container-lowest py-1.5 pl-7 pr-6 text-xs font-bold text-primary shadow-sm"
            >
              {speedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-matcha-sage"
            />
          </label>
        </div>
      </div>
    </section>
  )
}
