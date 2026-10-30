import { useRef, useState } from 'react'
import Icon from '../../components/Icon'
import type { TranscriptionStatus } from '../transcription/useTranscriber'

type MyTakeCardProps = {
  audioUrl: string | null
  durationMs: number
  transcript: string
  transcriptLabel: string
  isRecording: boolean
  isTranscribing: boolean
  transcriptionStatus: TranscriptionStatus
  transcriptionProgress: number
  transcriptionError: string | null
  transcriptionSupported: boolean
  error: string | null
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function TakePlayer({ src, durationMs }: { src: string; durationMs: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      if (audio.ended || audio.currentTime >= audio.duration) {
        audio.currentTime = 0
      }
      void audio.play()
    } else {
      audio.pause()
    }
  }

  return (
    <>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause your recording' : 'Play your recording'}
          className="focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition-transform active:scale-95"
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-lg" />
        </button>

        <div className="min-w-0 flex-1">
          <div
            role="progressbar"
            aria-label="Your recording playback"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="font-mono text-[10px] text-outline">
          {formatDuration(durationMs)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setProgress(0)
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget
          const totalSeconds =
            durationMs > 0 ? durationMs / 1000 : audio.duration
          if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
            setProgress(
              Math.min(100, (audio.currentTime / totalSeconds) * 100),
            )
          }
        }}
      />
    </>
  )
}

export default function MyTakeCard({
  audioUrl,
  durationMs,
  transcript,
  transcriptLabel,
  isRecording,
  isTranscribing,
  transcriptionStatus,
  transcriptionProgress,
  transcriptionError,
  transcriptionSupported,
  error,
}: MyTakeCardProps) {
  if (isRecording) return null
  if (
    !audioUrl &&
    !transcript &&
    !error &&
    !isTranscribing &&
    !transcriptionError
  ) {
    return null
  }

  return (
    <section
      aria-label="Your recording"
      className="mt-4 rounded-2xl border border-primary-fixed/60 bg-matcha-foam/40 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <Icon name="graphic_eq" className="text-base" />
          Your take
        </div>
        {durationMs > 0 ? (
          <span className="font-mono text-[10px] text-outline">
            {formatDuration(durationMs)}
          </span>
        ) : null}
      </div>

      {audioUrl ? (
        <TakePlayer key={audioUrl} src={audioUrl} durationMs={durationMs} />
      ) : null}

      {isTranscribing ? (
        <div
          aria-live="polite"
          className="mt-3 rounded-xl border border-primary/5 bg-surface-container-lowest p-3"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-outline">
            {transcriptionStatus === 'preparing'
              ? 'Preparing transcription'
              : 'Transcribing'}
          </div>
          <p className="mt-1 text-xs font-semibold text-primary">
            {transcriptionStatus === 'preparing'
              ? 'Preparing the transcription provider…'
              : 'Listening to your take…'}
          </p>
          {transcriptionStatus === 'transcribing' ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${transcriptionProgress}%` }}
              />
            </div>
          ) : (
            <p className="mt-1 text-[10px] leading-relaxed text-outline">
              This can take a moment on first use.
            </p>
          )}
        </div>
      ) : transcriptionError ? (
        <div className="mt-3 rounded-xl border border-error/20 bg-error-container p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-on-error-container">
            Transcription failed
          </div>
          <p className="mt-1 text-xs text-on-error-container">
            {transcriptionError}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-primary/5 bg-surface-container-lowest p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-outline">
            {transcriptLabel}
          </div>
          <p className="mt-1 text-xs italic leading-relaxed text-matcha-forest">
            {transcriptionSupported
              ? transcript
                ? `“${transcript}”`
                : 'No speech was detected.'
              : 'Transcript is not available in this browser.'}
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-2 text-[11px] font-medium text-error">{error}</p>
      ) : null}
    </section>
  )
}
