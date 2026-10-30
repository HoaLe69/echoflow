import {
  PROVIDERS,
} from '../../transcription/registry'
import {
  TRANSCRIPTION_PROVIDER_IDS,
  type TranscriptionProviderId,
} from '../../transcription/types'

type ProviderMenuProps = {
  value: TranscriptionProviderId
  onChange: (providerId: TranscriptionProviderId) => void
  disabled?: boolean
}

export default function ProviderMenu({
  value,
  onChange,
  disabled = false,
}: ProviderMenuProps) {
  const provider = PROVIDERS[value]

  return (
    <div className="rounded-xl border border-primary/10 bg-surface-container-low p-3">
      <label className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-matcha-forest">
          Transcription method
        </span>
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value as TranscriptionProviderId)
          }
          className="min-w-48 rounded-lg border border-primary/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          aria-label="Transcription method"
        >
          {TRANSCRIPTION_PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {PROVIDERS[id].label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-[11px] leading-relaxed text-matcha-sage">
        {provider.description}
      </p>

      {provider.kind === 'remote' ? (
        <p className="mt-1 text-[10px] leading-relaxed text-outline">
          Audio is sent to this app&apos;s server for this transcription.
        </p>
      ) : null}
    </div>
  )
}
