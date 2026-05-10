import { ClaudeApiError } from '@/llm/claudeClient'
import { createStrategy } from '@/strategies'
import { useConfigStore, useSessionStore } from '@/stores'

function getErrorMessage(error: unknown): string {
  if (error instanceof ClaudeApiError) {
    if (error.statusCode === 401) {
      return 'APIキーが無効です。設定から確認してください。'
    }

    if (error.statusCode === 429) {
      return 'API利用制限に達しました。しばらく待ってから再試行してください。'
    }

    if (error.statusCode >= 500) {
      return 'Claude APIでエラーが発生しました。'
    }

    return error.message
  }

  if (error instanceof TypeError) {
    return 'ネットワーク接続を確認してください。'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '分類に失敗しました。'
}

export function useClassification() {
  const currentInput = useSessionStore((state) => state.currentInput)
  const activeFramework = useSessionStore((state) => state.activeFramework)
  const previousGraph = useSessionStore((state) => state.graph)
  const setGraph = useSessionStore((state) => state.setGraph)
  const setClassifying = useSessionStore((state) => state.setClassifying)
  const setError = useSessionStore((state) => state.setError)

  const onStructurize = async () => {
    if (!activeFramework) {
      setError('フレームワークを選択してください。')
      return
    }

    setClassifying(true)
    setError(null)

    try {
      const {
        mode,
        apiKey,
        model,
        lastSelectedFramework,
        viewMode,
        whisperMode,
        openAiApiKey,
        localWhisperUrl,
      } = useConfigStore.getState()
      const strategy = createStrategy({
        mode,
        apiKey,
        model,
        lastSelectedFramework,
        viewMode,
        whisperMode,
        openAiApiKey,
        localWhisperUrl,
      })
      const graph = await strategy.classify(currentInput, activeFramework, {
        previousGraph: previousGraph ?? undefined,
      })
      setGraph(graph)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setClassifying(false)
    }
  }

  return {
    onStructurize,
  }
}
