type IconProps = {
  /** Material Symbols name, e.g. "favorite" or "volume_up". */
  name: string
  className?: string
  filled?: boolean
  /** Set only when the icon carries meaning on its own. Otherwise it is hidden from AT. */
  label?: string
}

export default function Icon({
  name,
  className = '',
  filled = false,
  label,
}: IconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  )
}
