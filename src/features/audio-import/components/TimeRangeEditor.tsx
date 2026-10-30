import { useState } from 'react'
import { MIN_TURN_DURATION_MS } from '../lib/draftTurns'

type TimeFieldProps = {
  label: string
  valueMs: number
  minMs: number
  maxMs: number
  onCommit: (valueMs: number) => void
}

function toSeconds(valueMs: number): string {
  return (valueMs / 1000).toFixed(2)
}

function TimeField({
  label,
  valueMs,
  minMs,
  maxMs,
  onCommit,
}: TimeFieldProps) {
  const [draft, setDraft] = useState(toSeconds(valueMs))

  const commit = () => {
    const seconds = Number(draft)
    if (!Number.isFinite(seconds)) {
      setDraft(toSeconds(valueMs))
      return
    }

    onCommit(Math.round(seconds * 1000))
  }

  return (
    <label className="flex items-center gap-1">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min={toSeconds(minMs)}
        max={toSeconds(maxMs)}
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        onFocus={(event) => event.currentTarget.select()}
        className="w-16 rounded-lg border border-primary/10 bg-white px-1.5 py-1 font-mono text-[11px] text-matcha-forest focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="text-[10px] text-outline">s</span>
    </label>
  )
}

type TimeRangeEditorProps = {
  startMs: number
  endMs: number
  durationMs: number
  onChange: (range: { startMs: number; endMs: number }) => void
}

export default function TimeRangeEditor({
  startMs,
  endMs,
  durationMs,
  onChange,
}: TimeRangeEditorProps) {
  const latestStartMs = Math.max(0, endMs - MIN_TURN_DURATION_MS)
  const earliestEndMs = startMs + MIN_TURN_DURATION_MS
  const latestEndMs = Math.max(earliestEndMs, durationMs)

  return (
    <div className="flex items-center gap-1.5">
      <TimeField
        key={`start-${startMs}`}
        label="Turn start time in seconds"
        valueMs={startMs}
        minMs={0}
        maxMs={latestStartMs}
        onCommit={(nextStartMs) => {
          const clamped = Math.min(
            Math.max(0, nextStartMs),
            latestStartMs,
          )
          if (clamped !== startMs) {
            onChange({ startMs: clamped, endMs })
          }
        }}
      />
      <span className="text-[10px] text-outline">–</span>
      <TimeField
        key={`end-${endMs}`}
        label="Turn end time in seconds"
        valueMs={endMs}
        minMs={earliestEndMs}
        maxMs={latestEndMs}
        onCommit={(nextEndMs) => {
          const clamped = Math.min(
            Math.max(earliestEndMs, nextEndMs),
            latestEndMs,
          )
          if (clamped !== endMs) {
            onChange({ startMs, endMs: clamped })
          }
        }}
      />
    </div>
  )
}
