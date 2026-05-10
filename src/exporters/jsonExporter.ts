import type { FrameworkGraph } from '@/types'
import { downloadBlob } from './pngExporter'

export function exportJson(graph: FrameworkGraph): void {
  const payload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    framework: graph.frameworkType,
    nodes: graph.nodes,
    edges: graph.edges,
    unclassified: graph.unclassified ?? [],
  }

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    `${graph.title || graph.frameworkType}.json`,
  )
}
