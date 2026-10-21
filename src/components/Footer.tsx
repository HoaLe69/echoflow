const shortcuts = [
  { key: 'Space', label: 'to speak' },
  { key: 'H', label: 'hide script' },
  { key: 'R', label: 'replay' },
] as const

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-primary/10 bg-surface-container-low py-5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-matcha-sage">Shortcuts:</span>
          {shortcuts.map((shortcut, index) => (
            <span key={shortcut.key} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-outline-variant">
                  ·
                </span>
              ) : null}
              <kbd className="rounded-md border border-primary/10 bg-surface-container-lowest px-2 py-0.5 text-xs font-bold text-matcha-forest shadow-sm">
                {shortcut.key}
              </kbd>
              <span className="text-xs text-matcha-sage">{shortcut.label}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-matcha-sage">
          <span className="hidden italic text-matcha-sage/80 sm:inline">
            🍵 Speak without mental translation
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="focus-ring rounded font-medium transition-colors hover:text-matcha-forest"
            >
              Sound Check
            </button>
            <button
              type="button"
              className="focus-ring rounded font-medium transition-colors hover:text-matcha-forest"
            >
              Help &amp; Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
