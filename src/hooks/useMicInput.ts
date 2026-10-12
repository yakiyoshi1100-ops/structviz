import { useCallback } from 'react'

import { useConfigStore } from '@/stores'

import { useSpeechRecognition } from './useSpeechRecognition'
import { useWhisperRecording } from './useWhisperRecording'

const noop = () => {}

/**
 * Selects Whisper-based recording when an OpenAI/local Whisper key is configured,
 * otherwise falls back to the browser Web Speech API.
 */
export function useMicInput(onTranscript: (text: string, isFinal: boolean) => void) {
  const whisperMode = useConfigStore((state) => state.whisperMode)
  const openAiApiKey = useConfigStore((state) => state.openAiApiKey)
  const localWhisperUrl = useConfigStore((state) => state.localWhisperUrl)

  const hasWhisper =
    whisperMode === 'openai' ? Boolean(openAiApiKey) : Boolean(localWhisperUrl)

  // Both hooks must always be called (Rules of Hooks).
  // Only the active one receives the real callback.
  const noopCb = useCallback(noop, [])
  const webSpeech = useSpeechRecognition(hasWhisper ? noopCb : onTranscript)
  const whisper = useWhisperRecording(hasWhisper ? onTranscript : noopCb)

  return hasWhisper ? whisper : webSpeech
}
