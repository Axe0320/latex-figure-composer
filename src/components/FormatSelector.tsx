import type { OutputFormat } from '../types/conversion'

interface FormatSelectorProps {
  value: OutputFormat
  onChange: (fmt: OutputFormat) => void
}

const FORMATS: { fmt: OutputFormat; name: string; desc: string }[] = [
  { fmt: 'pdf', name: 'PDF', desc: 'Portable Document Format' },
  { fmt: 'eps', name: 'EPS', desc: 'Encapsulated PostScript' },
]

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="format-selector">
      {FORMATS.map(({ fmt, name, desc }) => (
        <button
          key={fmt}
          className={`format-btn${value === fmt ? ' active' : ''}`}
          onClick={() => onChange(fmt)}
          aria-pressed={value === fmt}
        >
          <span className="format-btn-name">{name}</span>
          <span className="format-btn-desc">{desc}</span>
        </button>
      ))}
    </div>
  )
}
