import type { WhisperMode } from '@/types'

export interface WhisperResult {
  text: string
  language?: string
  duration?: number
}

export async function transcribeWithOpenAI(
  file: File,
  apiKey: string,
  signal?: AbortSignal,
): Promise<WhisperResult> {
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 600000)
  const combinedSignal = signal ?? timeoutController.signal
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-1')
  formData.append('language', 'ja')
  formData.append('response_format', 'json')

  try {
    const res = await fetch('/openai-api/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal: combinedSignal,
    })

    window.clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Whisper API error: ${res.status}`)
    }

    const data = await res.json()
    return { text: data.text, language: data.language }
  } catch (error) {
    window.clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        '文字起こしがタイムアウトしました。ファイルを分割するか、短い音声で試してください。',
      )
    }

    throw error
  }
}

export async function transcribeWithLocal(
  file: File,
  endpointUrl: string,
  signal?: AbortSignal,
): Promise<WhisperResult> {
  const formData = new FormData()
  formData.append('audio_file', file)
  formData.append('language', 'ja')

  const res = await fetch(endpointUrl, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!res.ok) {
    throw new Error(`Local Whisper error: ${res.status}`)
  }

  const text = await res.text()
  return { text: text.trim() }
}

export async function transcribe(
  file: File,
  config: {
    whisperMode: WhisperMode
    openAiApiKey: string | null
    localWhisperUrl: string | null
  },
  signal?: AbortSignal,
): Promise<WhisperResult> {
  if (config.whisperMode === 'openai') {
    if (!config.openAiApiKey) {
      throw new Error('OpenAI APIキーが設定されていません。設定パネルから入力してください。')
    }

    return transcribeWithOpenAI(file, config.openAiApiKey, signal)
  }

  if (!config.localWhisperUrl) {
    throw new Error('ローカルWhisperのURLが設定されていません。')
  }

  return transcribeWithLocal(file, config.localWhisperUrl, signal)
}
