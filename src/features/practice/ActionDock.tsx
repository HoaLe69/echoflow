import Icon from '../../components/Icon'

type ActionDockProps = {
  isRecording: boolean
  onListenAgain: () => void
  onReset: () => void
  onRecord: () => void
  onNext: () => void
  /** Optional cue shown under the mic while recording. */
  recordingHint?: string
}

const waveformBars = [
  { height: 'h-2', delay: '0s' },
  { height: 'h-4', delay: '0.1s' },
  { height: 'h-2.5', delay: '0.2s' },
  { height: 'h-5', delay: '0.15s' },
  { height: 'h-3', delay: '0.25s' },
] as const

export default function ActionDock({
  isRecording,
  onListenAgain,
  onReset,
  onRecord,
  onNext,
  recordingHint = 'Speak your line naturally.',
}: ActionDockProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-container-high/80 bg-surface-container-lowest/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-dock backdrop-blur-xl md:px-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onListenAgain}
            aria-label="Listen again"
            className="focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-full bg-matcha-foam px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary-fixed/80"
          >
            <Icon name="replay" className="text-base" />
            <span className="hidden md:inline">Listen Again</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset repetition"
            className="focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-container-low px-3.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="restart_alt" className="text-base" />
            <span className="hidden md:inline">Reset Repetition</span>
          </button>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
          <div
            aria-hidden="true"
            className={`mb-1 flex h-5 items-center justify-center gap-1 transition-opacity duration-300 ${
              isRecording ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {waveformBars.map((bar) => (
              <span
                key={bar.delay}
                style={{ animationDelay: bar.delay }}
                className={`w-1 animate-bounce rounded-full bg-primary ${bar.height}`}
              />
            ))}
          </div>

          <div className="relative flex items-center justify-center">
            {isRecording ? (
              <span
                aria-hidden="true"
                className="absolute -inset-2.5 animate-ping rounded-full bg-primary-fixed"
              />
            ) : null}
            <button
              type="button"
              onClick={onRecord}
              aria-pressed={isRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`focus-ring relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-on-primary shadow-mic transition-all hover:scale-105 active:scale-95 sm:h-16 sm:w-16 ${
                isRecording
                  ? 'bg-tertiary hover:bg-tertiary-container'
                  : 'bg-primary hover:bg-primary-container'
              }`}
            >
              <Icon
                name={isRecording ? 'graphic_eq' : 'mic'}
                className="text-2xl sm:text-3xl"
              />
            </button>
          </div>

          <div className="mt-1 text-center">
            <span
              className={`block max-w-[10rem] text-[11px] font-bold leading-tight sm:max-w-none sm:text-xs ${
                isRecording ? 'text-tertiary' : 'text-matcha-forest'
              }`}
            >
              {isRecording
                ? 'Listening warmly... Speak now!'
                : 'Tap or Press [Space] to Speak'}
            </span>
            <span className="mt-0.5 block max-w-[10rem] truncate text-[10px] leading-tight text-outline sm:max-w-[22rem] sm:text-[11px]">
              {isRecording
                ? recordingHint
                : 'Whisk your thoughts straight into sound!'}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2">
          <button
            type="button"
            onClick={onNext}
            className="focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-2.5 text-xs font-bold text-on-primary shadow-md transition-all hover:translate-x-0.5 hover:bg-primary-container sm:px-5"
          >
            Next Turn
            <Icon name="arrow_forward" className="text-base" />
          </button>
        </div>
      </div>
    </div>
  )
}
