import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'error' | 'unsupported'

export interface UseSpeechRecognitionReturn {
  status: SpeechStatus
  errorMessage: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  isSupported: boolean
}

export function useSpeechRecognition(
  onTranscript: (text: string, isFinal: boolean) => void,
): UseSpeechRecognitionReturn {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const shouldRestartRef = useRef(false)
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported')
      return
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionClass()

    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      shouldRestartRef.current = true
      setStatus('listening')
      setErrorMessage(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result[0]?.transcript.trim()

        if (transcript) {
          onTranscriptRef.current(transcript, result.isFinal)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Partial<Record<SpeechRecognitionErrorCode, string>> = {
        'not-allowed': 'マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。',
        'no-speech': '音声が検出されませんでした。',
        network: 'ネットワークエラーが発生しました。',
        'audio-capture': 'マイクが見つかりません。',
      }

      shouldRestartRef.current = false
      setErrorMessage(messages[event.error] ?? `音声認識エラー: ${event.error}`)
      setStatus('error')
    }

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start()
        } catch {
          shouldRestartRef.current = false
          setStatus('idle')
        }
      } else {
        setStatus('idle')
      }
    }

    recognitionRef.current = recognition

    return () => {
      shouldRestartRef.current = false
      recognition.abort()
      recognitionRef.current = null
    }
  }, [isSupported])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || status === 'listening') {
      return
    }

    try {
      shouldRestartRef.current = true
      recognitionRef.current.start()
    } catch {
      shouldRestartRef.current = false
      setErrorMessage('音声認識を開始できませんでした。')
      setStatus('error')
    }
  }, [status])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return
    }

    shouldRestartRef.current = false
    recognitionRef.current.stop()
    setStatus('idle')
  }, [])

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, status, stopListening])

  return { status, errorMessage, startListening, stopListening, toggleListening, isSupported }
}
