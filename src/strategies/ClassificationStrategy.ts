import type { FrameworkGraph, FrameworkType } from '@/types'

export interface ClassifyOptions {
  signal?: AbortSignal
  previousGraph?: FrameworkGraph
}

export interface ClassificationStrategy {
  readonly mode: 'standalone' | 'ai'
  classify(
    text: string,
    framework: FrameworkType,
    options?: ClassifyOptions,
  ): Promise<FrameworkGraph>
}
