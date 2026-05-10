import { create } from 'zustand'

import { getItem, setItem } from '@/utils/localStorage'
import { useConfigStore } from './configStore'

const UI_STORAGE_KEY = 'structviz-ui'

interface FloatingPanelPosition {
  x: number
  y: number
}

interface StoredUiState {
  floatingPanelPosition: FloatingPanelPosition
}

export interface UiStore {
  sidebarOpen: boolean
  inputPanelOpen: boolean
  settingsPanelOpen: boolean
  exportMenuOpen: boolean
  floatingPanelPosition: FloatingPanelPosition
  floatingPanelCollapsed: boolean
  selectedNodeId: string | null
  toggleSidebar: () => void
  toggleInputPanel: () => void
  toggleSettings: () => void
  toggleExportMenu: () => void
  setFloatingPosition: (position: FloatingPanelPosition) => void
  setFloatingCollapsed: (collapsed: boolean) => void
  selectNode: (nodeId: string | null) => void
}

const defaultFloatingPanelPosition: FloatingPanelPosition = {
  x: 24,
  y: 24,
}

function getStoredFloatingPanelPosition(): FloatingPanelPosition {
  return (
    getItem<StoredUiState>(UI_STORAGE_KEY)?.floatingPanelPosition ?? defaultFloatingPanelPosition
  )
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  inputPanelOpen: true,
  settingsPanelOpen: false,
  exportMenuOpen: false,
  floatingPanelPosition: getStoredFloatingPanelPosition(),
  floatingPanelCollapsed: false,
  selectedNodeId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleInputPanel: () => set((state) => ({ inputPanelOpen: !state.inputPanelOpen })),
  toggleSettings: () => set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),
  toggleExportMenu: () => set((state) => ({ exportMenuOpen: !state.exportMenuOpen })),
  setFloatingPosition: (floatingPanelPosition) => {
    set({ floatingPanelPosition })
    setItem<StoredUiState>(UI_STORAGE_KEY, { floatingPanelPosition })
  },
  setFloatingCollapsed: (floatingPanelCollapsed) => set({ floatingPanelCollapsed }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
}))

export const selectIsPresentationLayout = (): boolean =>
  useConfigStore.getState().viewMode === 'presentation'
