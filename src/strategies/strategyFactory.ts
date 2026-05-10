import type { AppConfig } from '@/types'
import { AIStrategy } from './AIStrategy'
import type { ClassificationStrategy } from './ClassificationStrategy'
import { StandaloneStrategy } from './StandaloneStrategy'

export function createStrategy(config: AppConfig): ClassificationStrategy {
  if (config.mode === 'ai' && config.apiKey) {
    return new AIStrategy(config.apiKey)
  }

  return new StandaloneStrategy()
}
