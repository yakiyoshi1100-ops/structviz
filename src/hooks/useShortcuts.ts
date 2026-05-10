import { useEffect } from 'react'

import { useConfigStore, useUiStore } from '@/stores'

interface ShortcutHandlers {
  onStructurize: () => void
}

export function useShortcuts({ onStructurize }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault()
        const { viewMode, setViewMode } = useConfigStore.getState()
        setViewMode(viewMode === 'presentation' ? 'facilitator' : 'presentation')
        return
      }

      if (event.key === 'Escape' && useUiStore.getState().settingsPanelOpen) {
        useUiStore.getState().toggleSettings()
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const target = event.target as HTMLElement | null

        if (target?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          onStructurize()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onStructurize])
}
