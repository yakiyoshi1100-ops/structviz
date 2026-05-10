import { Button } from '@/components/atoms'

export type ExportFormat = 'png' | 'svg' | 'md' | 'json'

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void
  disabled?: boolean
}

export function ExportMenu({ onExport, disabled = false }: ExportMenuProps) {
  return (
    <div className={`export-menu${disabled ? ' export-menu--disabled' : ''}`}>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onExport('png')}>
        PNG
      </Button>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onExport('svg')}>
        SVG
      </Button>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onExport('md')}>
        Markdown
      </Button>
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onExport('json')}>
        JSON
      </Button>
    </div>
  )
}
