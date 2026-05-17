import { ClaudeApiError } from '@/llm/claudeClient'
import { createStrategy } from '@/strategies'
import { useConfigStore, useCrossLinkStore } from '@/stores'
import type { FrameworkType } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof ClaudeApiError) {
    if (error.statusCode === 401) return 'APIキーが無効です。設定から確認してください。'
    if (error.statusCode === 429) return 'API利用制限に達しました。しばらく待ってから再試行してください。'
    if (error.statusCode >= 500) return 'Claude APIでエラーが発生しました。'
    return error.message
  }
  if (error instanceof TypeError) return 'ネットワーク接続を確認してください。'
  if (error instanceof Error) return error.message
  return '分類に失敗しました。'
}

export function useCrossLinkClassify() {
  const setSlotGraph = useCrossLinkStore((state) => state.setSlotGraph)
  const setSlotLoading = useCrossLinkStore((state) => state.setSlotLoading)

  const classifySlot = async (slotId: string, text: string, framework: FrameworkType) => {
    if (!text.trim()) return
    setSlotLoading(slotId, true)
    try {
      const config = useConfigStore.getState()
      const strategy = createStrategy(config)
      const graph = await strategy.classify(text.trim(), framework)
      setSlotGraph(slotId, graph)
    } catch (error) {
      console.error('[CrossLink] classify error:', getErrorMessage(error))
    } finally {
      setSlotLoading(slotId, false)
    }
  }

  return { classifySlot }
}
