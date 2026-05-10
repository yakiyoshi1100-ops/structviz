import { useEffect, useState } from 'react'

import { Button, IconButton } from '@/components/atoms'
import { ApiKeyInput } from '@/components/molecules'
import { useConfigStore, useSessionStore } from '@/stores'
import type { AppMode, WhisperMode } from '@/types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const mode = useConfigStore((state) => state.mode)
  const apiKey = useConfigStore((state) => state.apiKey)
  const whisperMode = useConfigStore((state) => state.whisperMode)
  const openAiApiKey = useConfigStore((state) => state.openAiApiKey)
  const localWhisperUrl = useConfigStore((state) => state.localWhisperUrl)
  const setMode = useConfigStore((state) => state.setMode)
  const setApiKey = useConfigStore((state) => state.setApiKey)
  const setViewMode = useConfigStore((state) => state.setViewMode)
  const setWhisperMode = useConfigStore((state) => state.setWhisperMode)
  const setOpenAiApiKey = useConfigStore((state) => state.setOpenAiApiKey)
  const setLocalWhisperUrl = useConfigStore((state) => state.setLocalWhisperUrl)
  const resetSession = useSessionStore((state) => state.reset)
  const [draftMode, setDraftMode] = useState<AppMode>(mode)
  const [draftApiKey, setDraftApiKey] = useState(apiKey ?? '')
  const [draftWhisperMode, setDraftWhisperMode] = useState<WhisperMode>(whisperMode)
  const [draftOpenAiApiKey, setDraftOpenAiApiKey] = useState(openAiApiKey ?? '')
  const [draftLocalWhisperUrl, setDraftLocalWhisperUrl] = useState(
    localWhisperUrl ?? 'http://localhost:9000/asr',
  )

  useEffect(() => {
    if (open) {
      setDraftMode(mode)
      setDraftApiKey(apiKey ?? '')
      setDraftWhisperMode(whisperMode)
      setDraftOpenAiApiKey(openAiApiKey ?? '')
      setDraftLocalWhisperUrl(localWhisperUrl ?? 'http://localhost:9000/asr')
    }
  }, [apiKey, localWhisperUrl, mode, open, openAiApiKey, whisperMode])

  const saveAnalysisMode = () => {
    setMode(draftMode)
    setApiKey(draftMode === 'ai' ? draftApiKey.trim() : null)
  }

  const saveWhisper = () => {
    setWhisperMode(draftWhisperMode)
    setOpenAiApiKey(draftOpenAiApiKey.trim() || null)
    setLocalWhisperUrl(draftLocalWhisperUrl.trim() || 'http://localhost:9000/asr')
  }

  const reset = () => {
    if (window.confirm('セッションデータをリセットしますか？')) {
      resetSession()
    }
  }

  return (
    <>
      <button
        type="button"
        className={`settings-overlay${open ? ' settings-overlay--open' : ''}`}
        aria-label="設定パネルを閉じる"
        onClick={onClose}
      />
      <aside className={`settings-panel${open ? ' settings-panel--open' : ''}`} aria-hidden={!open}>
        <header>
          <h2>設定</h2>
          <IconButton icon="×" label="設定を閉じる" onClick={onClose} />
        </header>

        <section>
          <h3>分析モード</h3>
          <div className="settings-radio-grid">
            <button
              type="button"
              className={draftMode === 'standalone' ? 'active' : ''}
              onClick={() => setDraftMode('standalone')}
            >
              <strong>スタンドアロン</strong>
              <span>ルールベースで分類します</span>
            </button>
            <button
              type="button"
              className={draftMode === 'ai' ? 'active' : ''}
              onClick={() => setDraftMode('ai')}
            >
              <strong>AIモード</strong>
              <span>Claude APIで分類します</span>
            </button>
          </div>
          {draftMode === 'ai' && (
            <ApiKeyInput
              value={draftApiKey}
              onChange={setDraftApiKey}
              label="Claude APIキー"
              placeholder="sk-ant-..."
            />
          )}
          <Button variant="primary" onClick={saveAnalysisMode}>
            保存
          </Button>
        </section>

        <section>
          <h3>音声文字起こし（Whisper）</h3>
          <div className="settings-radio-grid">
            <button
              type="button"
              className={draftWhisperMode === 'openai' ? 'active' : ''}
              onClick={() => setDraftWhisperMode('openai')}
            >
              <strong>OpenAI Whisper API</strong>
              <span>OpenAIのwhisper-1で音声ファイルを文字起こしします</span>
            </button>
            <button
              type="button"
              className={draftWhisperMode === 'local' ? 'active' : ''}
              onClick={() => setDraftWhisperMode('local')}
            >
              <strong>ローカルWhisper</strong>
              <span>faster-whisper-serverなどのローカルAPIを使います</span>
            </button>
          </div>
          {draftWhisperMode === 'openai' ? (
            <ApiKeyInput
              value={draftOpenAiApiKey}
              onChange={setDraftOpenAiApiKey}
              label="OpenAI APIキー"
              placeholder="sk-..."
            />
          ) : (
            <label className="field">
              <span>エンドポイントURL</span>
              <input
                className="settings-text-input"
                value={draftLocalWhisperUrl}
                placeholder="http://localhost:9000/asr"
                onChange={(event) => setDraftLocalWhisperUrl(event.target.value)}
              />
            </label>
          )}
          <a
            className="settings-help-link"
            href="https://github.com/fedirz/faster-whisper-server"
            target="_blank"
            rel="noreferrer"
          >
            ローカルWhisperの設定方法
          </a>
          <Button variant="primary" onClick={saveWhisper}>
            保存
          </Button>
        </section>

        <section>
          <h3>表示</h3>
          <Button variant="secondary" onClick={() => setViewMode('presentation')}>
            プレゼンモードに切り替え
          </Button>
        </section>

        <section>
          <h3>セッション</h3>
          <Button variant="danger" onClick={reset}>
            データをリセット
          </Button>
        </section>
      </aside>
    </>
  )
}
