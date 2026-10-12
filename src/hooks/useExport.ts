import type { RefObject } from 'react'

import { downloadMarkdown, exportJson, exportPng, exportSvg } from '@/exporters'
import { useSessionStore } from '@/stores'
import type { ExportFormat } from '@/components/molecules'

export function useExport(canvasRef: RefObject<HTMLElement | null>) {
  const graph = useSessionStore((state) => state.graph)
  const setError = useSessionStore((state) => state.setError)

  const onExport = async (format: ExportFormat) => {
    if (!graph) {
      return
    }

    const filename = graph.title || graph.frameworkType

    if (format === 'png' || format === 'svg') {
      if (!canvasRef.current) {
        setError('キャンバスが見つかりません。画面を確認してください。')
        return
      }
      try {
        if (format === 'png') {
          await exportPng(canvasRef.current, filename)
        } else {
          await exportSvg(canvasRef.current, filename)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '画像の出力に失敗しました'
        setError(`${format.toUpperCase()} 出力エラー: ${msg}`)
      }
      return
    }

    if (format === 'md') {
      downloadMarkdown(graph, filename)
      return
    }

    exportJson(graph)
  }

  return {
    onExport,
  }
}
