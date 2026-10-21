import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../../components/Icon'
import type { Level } from '../../types/scenario'

export type CustomLoopFormValues = {
  title: string
  level: Level
  role: 'speaker-a' | 'speaker-b'
  script: string
}

type CustomLoopModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: CustomLoopFormValues) => void
}

const inputClasses =
  'w-full rounded-xl border border-primary/10 bg-surface-container-low px-3.5 py-2 text-xs text-matcha-forest transition-colors placeholder:text-matcha-sage/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm'

export default function CustomLoopModal({
  open,
  onClose,
  onSubmit,
}: CustomLoopModalProps) {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<Level>('b1')
  const [role, setRole] = useState<'speaker-a' | 'speaker-b'>('speaker-a')
  const [script, setScript] = useState('')

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ title, level, role, script })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-matcha-forest/30 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-loop-title"
        aria-describedby="custom-loop-description"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-primary/15 bg-surface-container-lowest p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-matcha-foam text-lg text-primary"
            >
              ✍️
            </div>
            <h2
              id="custom-loop-title"
              className="font-headline text-lg font-bold text-matcha-forest"
            >
              Prepare Custom Dialogue
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-ring rounded-full p-1 text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-matcha-forest"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <p
          id="custom-loop-description"
          className="mt-3 text-xs leading-relaxed text-matcha-sage sm:text-sm"
        >
          Got a meeting, interview, or specific chat coming up? Drop the
          scenario here to create your personal repetition loop!
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-matcha-forest">
              Scenario Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Asking for matcha latte recommendation"
              autoFocus
              className={inputClasses}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">Level</span>
              <div className="relative">
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value as Level)}
                  className={`${inputClasses} appearance-none pr-9`}
                >
                  <option value="a1-a2">A2 (Simple &amp; Slow)</option>
                  <option value="b1">B1 (Everyday Fluency)</option>
                  <option value="b2">B2 (Work Professional)</option>
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-matcha-sage"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-matcha-forest">
                Your Role
              </span>
              <div className="relative">
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as 'speaker-a' | 'speaker-b')
                  }
                  className={`${inputClasses} appearance-none pr-9`}
                >
                  <option value="speaker-a">Speaker A (Initiator)</option>
                  <option value="speaker-b">Speaker B (Responder)</option>
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-matcha-sage"
                />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-matcha-forest">
              Script Dialogue
            </span>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              rows={3}
              placeholder={
                'Speaker A: What would you recommend for iced drinks?\nSpeaker B: The ceremonial grade matcha latte with oat milk is wonderful!'
              }
              className={`${inputClasses} resize-none`}
            />
          </label>

          <div className="mt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full px-4 py-2 text-xs font-semibold text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-matcha-forest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="focus-ring rounded-full bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95"
            >
              Create Practice Loop 🍵
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
