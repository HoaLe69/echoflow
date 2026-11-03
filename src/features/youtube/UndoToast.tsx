import Icon from '../../components/Icon'

type UndoToastProps = {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export default function UndoToast({
  message,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[55] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl bg-matcha-forest px-4 py-3 text-white shadow-2xl"
      >
        <span className="min-w-0 flex-1 text-xs font-semibold leading-snug">
          {message}
        </span>
        <button
          type="button"
          onClick={onUndo}
          className="focus-ring shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="focus-ring shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="close" className="text-base" />
        </button>
      </div>
    </div>
  )
}
