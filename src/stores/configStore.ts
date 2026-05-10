import { create } from 'zustand'

import type { AppConfig, AppMode, FrameworkType, WhisperMode } from '@/types'
import { getItem, setItem } from '@/utils/localStorage'

const CONFIG_STORAGE_KEY = 'structviz-config'

const defaultConfig: AppConfig = {
  mode: 'standalone',
  apiKey: null,
  model: 'claude-sonnet-4-6',
  lastSelectedFramework: null,
  viewMode: 'facilitator',
  whisperMode: 'openai',
  openAiApiKey: null,
  localWhisperUrl: 'http://localhost:9000/asr',
}

export interface ConfigStore extends AppConfig {
  hasConfigured: boolean
  setMode: (mode: AppMode) => void
  setApiKey: (apiKey: string | null) => void
  setLastFramework: (framework: FrameworkType | null) => void
  setViewMode: (viewMode: AppConfig['viewMode']) => void
  setWhisperMode: (mode: WhisperMode) => void
  setOpenAiApiKey: (key: string | null) => void
  setLocalWhisperUrl: (url: string | null) => void
  hydrate: () => void
}

function persistConfig(config: AppConfig): void {
  setItem<AppConfig>(CONFIG_STORAGE_KEY, config)
}

function selectConfig(state: ConfigStore): AppConfig {
  return {
    mode: state.mode,
    apiKey: state.apiKey,
    model: state.model,
    lastSelectedFramework: state.lastSelectedFramework,
    viewMode: state.viewMode,
    whisperMode: state.whisperMode,
    openAiApiKey: state.openAiApiKey,
    localWhisperUrl: state.localWhisperUrl,
  }
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  ...defaultConfig,
  hasConfigured: false,
  setMode: (mode) => {
    set({ mode, hasConfigured: true })
    persistConfig(selectConfig(get()))
  },
  setApiKey: (apiKey) => {
    set({ apiKey })
    persistConfig(selectConfig(get()))
  },
  setLastFramework: (lastSelectedFramework) => {
    set({ lastSelectedFramework })
    persistConfig(selectConfig(get()))
  },
  setViewMode: (viewMode) => {
    set({ viewMode })
  },
  setWhisperMode: (whisperMode) => {
    set({ whisperMode })
    persistConfig(selectConfig(get()))
  },
  setOpenAiApiKey: (openAiApiKey) => {
    set({ openAiApiKey })
    persistConfig(selectConfig(get()))
  },
  setLocalWhisperUrl: (localWhisperUrl) => {
    set({ localWhisperUrl })
    persistConfig(selectConfig(get()))
  },
  hydrate: () => {
    const storedConfig = getItem<Partial<AppConfig>>(CONFIG_STORAGE_KEY)

    if (!storedConfig) {
      return
    }

    set({
      ...defaultConfig,
      ...storedConfig,
      model: 'claude-sonnet-4-6',
      hasConfigured: true,
    })
  },
}))

export const selectIsAiReady = (state: ConfigStore): boolean =>
  state.mode === 'ai' && Boolean(state.apiKey)
