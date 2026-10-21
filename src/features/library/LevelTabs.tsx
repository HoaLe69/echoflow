import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import type { Level } from '../../types/scenario'

export type LevelFilter = Level | 'all'

const options: readonly SegmentedOption<LevelFilter>[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'a1-a2', label: '🌱 A1-A2 Beginner' },
  { value: 'b1', label: '🍵 B1 Everyday Fluency' },
  { value: 'b2', label: '💼 B2 Pro' },
]

type LevelTabsProps = {
  value: LevelFilter
  onChange: (value: LevelFilter) => void
  className?: string
}

export default function LevelTabs({
  value,
  onChange,
  className = '',
}: LevelTabsProps) {
  return (
    <div className={`min-w-0 overflow-x-auto ${className}`}>
      <SegmentedControl
        label="Filter scenarios by level"
        options={options}
        value={value}
        onChange={onChange}
        className="w-max"
      />
    </div>
  )
}
