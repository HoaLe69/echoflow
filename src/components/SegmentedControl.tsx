import type { ReactNode } from 'react'

export type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
}

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group. */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  className = '',
}: SegmentedControlProps<T>) {
  const sizing = size === 'sm' ? 'px-3.5 py-1.5' : 'px-3 py-1'

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex items-center gap-1 rounded-full border border-primary/10 bg-surface-container-low/90 p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`${sizing} focus-ring whitespace-nowrap rounded-full text-xs transition-all ${
              active
                ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                : 'font-semibold text-matcha-sage hover:bg-surface-container-lowest/70 hover:text-matcha-forest'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
