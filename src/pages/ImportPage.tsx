import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from 'react-router-dom'
import Header from "../components/Header";
import Icon from "../components/Icon";
import { useAudioImportFlow } from "../features/audio-import/hooks/useAudioImportFlow";
import { AUDIO_ACCEPT, formatDuration } from "../features/audio-import/lib/validateAudioFile";
import { getImportSupport } from "../features/audio-import/lib/support";
import type {
  DraftTurn,
  ImportFormValues,
  SpeakerLabel
} from "../features/audio-import/types";


function useObjectUrl(file: File | null): string | null {
  const url = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return url
}

const initialForm: ImportFormValues = {
  title: '',
  level: 'b1',
  topic: 'Imported',
  goal: '',
  roleA: 'Speaker A',
  roleB: 'Speaker B',
}

export default function ImportPage() {
  const navigate = useNavigate()
  const support = getImportSupport()
  const flow = useAudioImportFlow()
  const audioUrl = useObjectUrl(flow.file)
  const audioRef = useRef<HTMLAudioElement>(null)
  const stopAtRef = useRef<number | null>(null)
  const [form, setForm] = useState<ImportFormValues>(initialForm)

  const updateForm = <K extends keyof ImportFormValues>(
    key: K,
    value: ImportFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const playTurn = (turn: DraftTurn) => {
    const audio = audioRef.current
    if (!audio) return
    stopAtRef.current = turn.endMs / 1000
    audio.currentTime = turn.startMs / 1000
    void audio.play()
  }
  const handleSave = async () => {
    const scenarioId = await flow.save(form)
    if (scenarioId) navigate(`/practice/${scenarioId}`)
  }


  return <div className="flex min-h-dvh flex-col bg-surface">
    <Header subtitle="Import audio" />
    <main className="flex-1 pt-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="focus-ring inline-flex items-center gap-1 rounded-full text-sm font-semibold text-matcha-sage hover:text-primary">
            <Icon name="arrow_back" className="text-base" />
            Back to library
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wide text-outline">
            Step {flow.step === 'upload' ? 1 : flow.step === 'transcribe' ? 2 : 3} of 3
          </span>
        </div>

        <div>
          <h1 className="font-headline text-2xl font-extrabold text-matcha-forest">
            Import a conversation
          </h1>
          <p className="mt-1 text-sm text-matcha-sage">
            Upload a two-person recording. Transcription stays in your browser.
          </p>
        </div>

        {!support.supported ? (
          <p
            role="alert"
            className="rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-xs font-medium text-on-error-container"
          >
            {support.reason}
          </p>
        ) : null}

        {flow.step === 'upload' ? (
          <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 shadow-card">
            <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-surface-container-low px-6 py-12 text-center transition-colors hover:bg-matcha-foam/40 focus-within:ring-2 focus-within:ring-primary/40">
              <Icon name="audio_file" className="text-3xl text-primary" />
              <span className="text-sm font-bold text-matcha-forest">
                Choose an audio file
              </span>
              <span className="text-xs text-matcha-sage">
                MP3, WAV, M4A, OGG · up to 5 minutes / 50 MB
              </span>
              <input
                type="file"
                accept={AUDIO_ACCEPT}
                aria-label="Choose an audio file"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0]
                  if (nextFile) void flow.chooseFile(nextFile)
                }}
              />
            </label>

            {flow.fileError ? (
              <p className="mt-3 text-xs font-medium text-error">{flow.fileError}</p>
            ) : null}

            <p className="mt-3 text-[11px] leading-relaxed text-outline">
              Your audio stays in this browser. It is not uploaded to a server.
            </p>
          </section>
        ) : null}

        {flow.step === 'transcribe' ? (
          <section className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 shadow-card">
            <div>
              <p className="text-sm font-bold text-matcha-forest">
                {flow.file?.name}
              </p>
              <p className="text-xs text-matcha-sage">
                {formatDuration(flow.durationMs)}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-matcha-sage">
              The first run downloads a ~60 MB Whisper model. It stays cached
              in your browser. Audio is not uploaded to a server.
            </p>

            <p className="text-[11px] leading-relaxed text-outline">
              If the model fails to load, run <code>npm run model:download</code>{' '}
              and reload this page.
            </p>

            {flow.transcriber.status === 'loading-model' ? (
              <p className="text-xs font-semibold text-primary">
                Loading the Whisper model…
              </p>
            ) : null}

            {flow.transcriber.status === 'transcribing' ? (
              <div className="flex flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${flow.transcriber.progress}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-matcha-sage">
                  Transcribing… {flow.transcriber.progress}%
                </p>
              </div>
            ) : null}

            {flow.transcriber.error ? (
              <p role="alert" className="text-xs font-medium text-error">
                {flow.transcriber.error}
              </p>
            ) : null}

            {!flow.transcriber.isBusy ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void flow.transcribe()}
                  disabled={!support.supported}
                  className="focus-ring rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-container disabled:opacity-50"
                >
                  Start transcription
                </button>
                <button
                  type="button"
                  onClick={flow.reset}
                  className="focus-ring rounded-full px-4 py-2 text-xs font-semibold text-matcha-sage hover:bg-surface-container-low"
                >
                  Choose another file
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void flow.transcriber.cancel()}
                className="focus-ring w-fit rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-matcha-forest"
              >
                Cancel
              </button>
            )}
          </section>
        ) : null}


        {flow.step === 'review' ? (
          <section className="flex flex-col gap-5">
            <div className="rounded-3xl border border-primary/10 bg-surface-container-lowest shadow-card">
              {audioUrl ? (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  className="w-full"
                  onTimeUpdate={() => {
                    const audio = audioRef.current
                    if (
                      audio &&
                      stopAtRef.current !== null &&
                      audio.currentTime >= stopAtRef.current
                    ) {
                      audio.pause()
                      stopAtRef.current = null
                    }
                  }}
                />
              ) : null}
            </div>
            <div className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 shadow-card">
              <h2 className="font-headline text-lg font-bold text-matcha-forest">
                Review transcript
              </h2>
              <p className="mt-1 text-xs text-matcha-sage">
                Whisper does not know who is speaking. Correct the speaker labels
                and text before saving.
              </p>

              <div className="mt-4 flex max-h-[45vh] flex-col gap-3 overflow-y-auto pr-1">
                {flow.turns.map((turn, index) => (
                  <div
                    key={turn.id}
                    className="rounded-2xl border border-primary/10 bg-surface-container-low p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <select
                        value={turn.speaker}
                        onChange={(event) =>
                          flow.updateTurn(turn.id, {
                            speaker: event.target.value as SpeakerLabel,
                          })
                        }
                        className="rounded-full border border-primary/10 bg-white px-2 py-1 text-xs font-bold text-primary"
                        aria-label={`Speaker for turn ${index + 1}`}
                      >
                        <option value="A">Speaker A</option>
                        <option value="B">Speaker B</option>
                      </select>

                      <span className="font-mono text-[11px] text-outline">
                        {formatDuration(turn.startMs)} –{' '}
                        {formatDuration(turn.endMs)}
                      </span>

                      <button
                        type="button"
                        onClick={() => playTurn(turn)}
                        className="focus-ring rounded-full px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-high"
                      >
                        Play
                      </button>
                    </div>

                    <textarea
                      value={turn.text}
                      onChange={(event) =>
                        flow.updateTurn(turn.id, { text: event.target.value })
                      }
                      rows={2}
                      className="mt-2 w-full resize-none rounded-xl border border-primary/10 bg-white px-3 py-2 text-xs text-matcha-forest focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      <button
                        type="button"
                        onClick={() => flow.mergeTurn(index)}
                        disabled={index === 0}
                        className="font-semibold text-matcha-sage hover:text-primary disabled:opacity-40"
                      >
                        Merge previous
                      </button>
                      <button
                        type="button"
                        onClick={() => flow.splitTurn(index)}
                        className="font-semibold text-matcha-sage hover:text-primary"
                      >
                        Split
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-primary/10 bg-surface-container-lowest p-6 shadow-card">
              <h2 className="font-headline text-lg font-bold text-matcha-forest">
                Scenario details
              </h2>

              <label className="flex flex-col gap-1 text-xs font-bold text-matcha-forest">
                Title
                <input
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  placeholder="e.g. Coffee shop conversation"
                  className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm font-normal text-matcha-forest focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-bold text-matcha-forest">
                  Level
                  <select
                    value={form.level}
                    onChange={(event) =>
                      updateForm(
                        'level',
                        event.target.value as ImportFormValues['level'],
                      )
                    }
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm font-normal"
                  >
                    <option value="a1-a2">A1–A2</option>
                    <option value="b1">B1</option>
                    <option value="b2">B2</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-matcha-forest">
                  Topic
                  <input
                    value={form.topic}
                    onChange={(event) => updateForm('topic', event.target.value)}
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm font-normal"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-matcha-forest">
                  Speaker A role
                  <input
                    value={form.roleA}
                    onChange={(event) => updateForm('roleA', event.target.value)}
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm font-normal"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-matcha-forest">
                  Speaker B role
                  <input
                    value={form.roleB}
                    onChange={(event) => updateForm('roleB', event.target.value)}
                    className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2 text-sm font-normal"
                  />
                </label>
              </div>

              {flow.saveError ? (
                <p role="alert" className="text-xs font-medium text-error">
                  {flow.saveError}
                </p>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={flow.reset}
                  className="focus-ring rounded-full px-4 py-2 text-xs font-semibold text-matcha-sage hover:bg-surface-container-low"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={flow.isSaving}
                  className="focus-ring rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-container disabled:opacity-50"
                >
                  {flow.isSaving ? 'Saving…' : 'Save imported scenario'}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  </div>
}

