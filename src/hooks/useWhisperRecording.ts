import { useCallback, useEffect, useRef, useState } from 'react'

import { transcribeWithLocal, transcribeWithOpenAI } from '@/llm/whisperClient'
import { useConfigStore } from '@/stores'

import type { SpeechStatus } from './useSpeechRecognition'

export interface UseWhisperRecordingReturn {
  status: SpeechStatus
  errorMessage: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  isSupported: boolean
}

export function useWhisperRecording(
  onTranscript: (text: string, isFinal: boolean) => void,
): UseWhisperRecordingReturn {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const onTranscriptRef = useRef(onTranscript)
  const whisperMode = useConfigStore((state) => state.whisperMode)
  const openAiApiKey = useConfigStore((state) => state.openAiApiKey)
  const localWhisperUrl = useConfigStore((state) => state.localWhisperUrl)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const isSupported =
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)

  const startListening = useCallback(async () => {
    if (mediaRecorderRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        mediaRecorderRef.current = null

        const blobType = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        const ext = blobType.includes('ogg') ? '.ogg' : '.webm'
        const file = new File([blob], `recording${ext}`, { type: blobType })

        onTranscriptRef.current('文字起こし中...', false)

        try {
          let result
          if (whisperMode === 'openai') {
            if (!openAiApiKey) {
              throw new Error('OpenAI APIキーが設定されていません。設定パネルから入力してください。')
            }
            result = await transcribeWithOpenAI(file, openAiApiKey)
          } else {
            if (!localWhisperUrl) {
              throw new Error('ローカルWhisperのURLが設定されていません。')
            }
            result = await transcribeWithLocal(file, localWhisperUrl)
          }

          onTranscriptRef.current(result.text, true)
          setStatus('idle')
          setErrorMessage(null)
        } catch (err) {
          onTranscriptRef.current('', false)
          const msg = err instanceof Error ? err.message : '文字起こしに失敗しました。'
          setErrorMessage(msg)
          setStatus('error')
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setStatus('listening')
      setErrorMessage(null)
    } catch (err) {
      const isPermission =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      setErrorMessage(
        isPermission
          ? 'マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。'
          : 'マイクにアクセスできません。',
      )
      setStatus('error')
    }
  }, [whisperMode, openAiApiKey, localWhisperUrl])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [status, startListening, stopListening])

  return { status, errorMessage, startListening, stopListening, toggleListening, isSupported }
}
