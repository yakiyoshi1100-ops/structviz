import { useCallback, useRef, useState } from 'react'

import { transcribe as transcribeAudio } from '@/llm/whisperClient'
import { useConfigStore, useSessionStore } from '@/stores'

export type TranscriptionStatus = 'idle' | 'uploading' | 'transcribing' | 'done' | 'error'

export interface UseFileTranscriptionReturn {
  status: TranscriptionStatus
  progress: number
  errorMessage: string | null
  transcribe: (file: File) => Promise<void>
  cancel: () => void
}

export function useFileTranscription(
  onComplete: (text: string) => void,
): UseFileTranscriptionReturn {
  const abortRef = useRef<AbortController | null>(null)
  const whisperMode = useConfigStore((state) => state.whisperMode)
  const openAiApiKey = useConfigStore((state) => state.openAiApiKey)
  const localWhisperUrl = useConfigStore((state) => state.localWhisperUrl)
  const setError = useSessionStore((state) => state.setError)
  const [status, setStatus] = useState<TranscriptionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
    setProgress(0)
  }, [])

  const transcribe = useCallback(
    async (file: File) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setErrorMessage(null)
      setStatus('uploading')
      setProgress(20)

      try {
        setStatus('transcribing')
        setProgress(45)
        const result = await transcribeAudio(
          file,
          { whisperMode, openAiApiKey, localWhisperUrl },
          controller.signal,
        )

        if (controller.signal.aborted) {
          return
        }

        onComplete(result.text)
        setProgress(100)
        setStatus('done')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        const message = error instanceof Error ? error.message : '文字起こしに失敗しました。'
        setErrorMessage(message)
        setError(message)
        setStatus('error')
        setProgress(0)
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [localWhisperUrl, onComplete, openAiApiKey, setError, whisperMode],
  )

  return { status, progress, errorMessage, transcribe, cancel }
}
