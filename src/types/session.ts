import type { AppConfig } from './config'
import type { FrameworkType } from './framework'
import type { FrameworkGraph } from './graph'

export interface InputEntry {
  id: string
  content: string
  createdAt: string
}

export interface SessionState {
  config: AppConfig
  selectedFramework: FrameworkType | null
  currentGraph: FrameworkGraph | null
  inputHistory: InputEntry[]
  isProcessing: boolean
  error: string | null
}
