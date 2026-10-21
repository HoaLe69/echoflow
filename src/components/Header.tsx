import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type HeaderProps = {
  /** Small uppercase line under the wordmark, e.g. "Matcha practice". */
  subtitle?: string
  /** Optional actions rendered on the right side of the bar. */
  right?: ReactNode
}

export default function Header({ subtitle, right }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary/10 bg-surface/90 shadow-header backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="EchoFlow home"
          className="focus-ring group flex items-center gap-2 rounded-2xl"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-fixed text-lg shadow-sm transition-transform group-hover:scale-105"
          >
            🍵
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-extrabold leading-none tracking-tight text-primary">
              EchoFlow
            </span>
            {subtitle ? (
              <span className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-wide text-outline">
                {subtitle}
              </span>
            ) : null}
          </span>
        </Link>
        {right}
      </div>
    </header>
  )
}
