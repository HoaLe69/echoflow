import Icon from '../../components/Icon'

const shortcuts = [
  { keys: 'N', label: 'Add a note' },
  { keys: 'Space', label: 'Play or pause' },
  { keys: 'L', label: 'Toggle loop' },
] as const

export default function ShortcutsHelp() {
  return (
    <details className="relative">
      <summary
        aria-label="Keyboard shortcuts"
        className="focus-ring flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-primary/10 bg-surface-container-low px-3 py-2 text-xs font-bold text-matcha-sage transition-colors hover:bg-matcha-foam hover:text-primary [&::-webkit-details-marker]:hidden"
      >
        <Icon name="keyboard" className="text-base" />
        <span className="hidden sm:inline">Shortcuts</span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-primary/15 bg-surface-container-lowest p-4 shadow-xl">
        <p className="text-xs font-bold text-matcha-forest">
          Keyboard shortcuts
        </p>
        <dl className="mt-2 flex flex-col gap-1.5">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-3"
            >
              <dt className="text-[11px] text-matcha-sage">
                {shortcut.label}
              </dt>
              <dd>
                <kbd className="rounded-md border border-primary/10 bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-matcha-forest">
                  {shortcut.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[10px] leading-relaxed text-outline">
          Shortcuts are ignored while you type in the note form.
        </p>
      </div>
    </details>
  )
}
