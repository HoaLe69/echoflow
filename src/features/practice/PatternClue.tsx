import Icon from '../../components/Icon'

type PatternClueProps = {
  title: string
  pattern: string
  description: string
}

export default function PatternClue({
  title,
  pattern,
  description,
}: PatternClueProps) {
  return (
    <div className="mt-3 rounded-2xl border border-mochi-rose/30 bg-mochi-blush/60 p-3 text-matcha-forest transition-all">
      <div className="flex items-start gap-2">
        <Icon name="help" className="mt-0.5 text-base text-tertiary" />
        <div className="text-xs">
          <div className="font-bold text-tertiary">{title}</div>
          <div className="mt-0.5 leading-snug text-on-surface-variant">
            <strong>{pattern}</strong> — {description}
          </div>
        </div>
      </div>
    </div>
  )
}
