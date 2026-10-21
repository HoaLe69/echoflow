import type { ReactNode } from 'react'

export type PillTone =
  | 'primary'
  | 'primary-fixed'
  | 'neutral'
  | 'blush'
  | 'quiet'

type PillProps = {
  children: ReactNode
  tone?: PillTone
  size?: 'sm' | 'md'
  className?: string
}

const toneClasses: Record<PillTone, string> = {
  primary: 'bg-matcha-foam font-bold text-primary',
  'primary-fixed': 'bg-primary-fixed/80 font-bold text-primary',
  neutral: 'bg-surface-container-low font-medium text-matcha-sage',
  blush: 'bg-mochi-blush font-semibold text-tertiary',
  quiet:
    'border border-primary/10 bg-surface-container-lowest font-semibold text-matcha-sage',
}

const sizeClasses = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
}

export default function Pill({
  children,
  tone = 'neutral',
  size = 'sm',
  className = '',
}: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  )
}
