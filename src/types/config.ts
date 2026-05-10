import type { FrameworkType } from './framework'

export type AppMode = 'standalone' | 'ai'
export type WhisperMode = 'openai' | 'local'

export interface AppConfig {
  mode: AppMode
  apiKey: string | null
  model: 'claude-sonnet-4-6'
  lastSelectedFramework: FrameworkType | null
  viewMode: 'facilitator' | 'presentation'
  whisperMode: WhisperMode
  openAiApiKey: string | null
  localWhisperUrl: string | null
}
