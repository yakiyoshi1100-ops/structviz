import { Badge } from '@/components/atoms'
import type { AppConfig } from '@/types'

interface ModeToggleProps {
  mode: AppConfig['viewMode']
  onChange: (mode: AppConfig['viewMode']) => void
  aiReady: boolean
}

export function ModeToggle({ mode, onChange, aiReady }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="表示モード切り替え">
      <button
        type="button"
        className={mode === 'facilitator' ? 'active' : ''}
        onClick={() => onChange('facilitator')}
      >
        facilitator
      </button>
      <button
        type="button"
        className={mode === 'presentation' ? 'active' : ''}
        onClick={() => onChange('presentation')}
      >
        presentation
      </button>
      <button
        type="button"
        className={mode === 'crosslink' ? 'active' : ''}
        onClick={() => onChange('crosslink')}
      >
        🔗 crosslink
      </button>
      <Badge label={aiReady ? 'AI ready' : 'standalone'} color={aiReady ? 'green' : 'gray'} />
    </div>
  )
}
