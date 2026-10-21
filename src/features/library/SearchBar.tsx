import { useId } from 'react'
import Icon from '../../components/Icon'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search coffee, airport, standup, small talk...',
  className = '',
}: SearchBarProps) {
  const inputId = useId()

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Search scenarios
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-matcha-sage"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-primary/10 bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-matcha-forest shadow-sm transition-all placeholder:text-matcha-sage/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}
