import type { RefObject } from 'react'

import { downloadMarkdown, exportJson, exportPng } from '@/exporters'
import { useSessionStore } from '@/stores'
import type { ExportFormat } from '@/components/molecules'

export function useExport(canvasRef: RefObject<HTMLElement | null>) {
  const graph = useSessionStore((state) => state.graph)

  const onExport = async (format: ExportFormat) => {
    if (!graph) {
      return
    }

    if (format === 'svg') {
      alert('SVGエクスポートはPhase 2で対応予定です')
      return
    }

    if (format === 'png') {
      if (canvasRef.current) {
        await exportPng(canvasRef.current, graph.title || graph.frameworkType)
      }
      return
    }

    if (format === 'md') {
      downloadMarkdown(graph, graph.title || graph.frameworkType)
      return
    }

    exportJson(graph)
  }

  return {
    onExport,
  }
}
