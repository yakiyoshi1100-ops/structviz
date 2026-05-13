import { useState } from 'react'

import { Button } from '@/components/atoms'
import { ApiKeyInput } from '@/components/molecules'
import { useConfigStore } from '@/stores'
import type { AppMode } from '@/types'
import { removeItem } from '@/utils/localStorage'

interface ModeSelectPageProps {
  onComplete: () => void
}

export function ModeSelectPage({ onComplete }: ModeSelectPageProps) {
  const storedApiKey = useConfigStore((state) => state.apiKey)
  const setMode = useConfigStore((state) => state.setMode)
  const setApiKey = useConfigStore((state) => state.setApiKey)
  const [selectedMode, setSelectedMode] = useState<AppMode>('standalone')
  const [apiKey, setLocalApiKey] = useState(storedApiKey ?? '')
  const [autoSelect, setAutoSelect] = useState(true)
  const canStart = selectedMode === 'standalone' || apiKey.trim().length > 0

  const startSession = () => {
    setMode(selectedMode)
    setApiKey(selectedMode === 'ai' ? apiKey.trim() : null)

    if (!autoSelect) {
      removeItem('structviz-config')
    }

    onComplete()
  }

  return (
    <main className="mode-page sv-startup">
      <section className="mode-shell">
        <header className="mode-header">
          <div className="sv-startup__logo">
            <div className="sv-startup__mark" aria-hidden>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 17.5h7M17.5 14v7" />
              </svg>
            </div>
            <h1 className="sv-startup__title">
              Struct<em>Viz</em>
            </h1>
          </div>
          <p className="sv-startup__tagline">
            会議中のテキストや音声を、コンサルティングフレームワークへリアルタイムに構造化します。
          </p>
        </header>

        <div className="mode-grid sv-modegrid" role="radiogroup" aria-label="分析モード">
          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === 'standalone'}
            className={`mode-card sv-modecard${selectedMode === 'standalone' ? ' mode-card--active' : ''}`}
            data-variant="standalone"
            data-selected={selectedMode === 'standalone' ? 'true' : 'false'}
            onClick={() => setSelectedMode('standalone')}
          >
            <div className="sv-modecard__icon" aria-hidden>
              ✓
            </div>
            <h2 className="sv-modecard__title">スタンドアロン</h2>
            <p className="sv-modecard__desc">
              APIキー不要。ブラウザ内のルールベース分類で、すばやく構造化します。
            </p>
            <div className="sv-modecard__meta">
              <span>オフライン可</span>
              <span className="sv-modecard__cta">すぐ開始</span>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === 'ai'}
            className={`mode-card sv-modecard${selectedMode === 'ai' ? ' mode-card--active' : ''}`}
            data-variant="ai"
            data-selected={selectedMode === 'ai' ? 'true' : 'false'}
            onClick={() => setSelectedMode('ai')}
          >
            <div className="sv-modecard__icon" aria-hidden>
              ✦
            </div>
            <h2 className="sv-modecard__title">AIモード</h2>
            <p className="sv-modecard__desc">
              Claude APIで自然文の文脈を読み取り、より高精度に分類します。
            </p>
            <div className="sv-modecard__meta">
              <span>APIキーが必要</span>
              <span className="sv-modecard__cta">高精度</span>
            </div>
          </button>
        </div>

        {selectedMode === 'ai' && <ApiKeyInput value={apiKey} onChange={setLocalApiKey} />}

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={autoSelect}
            onChange={(event) => setAutoSelect(event.target.checked)}
          />
          <span>次回から自動選択</span>
        </label>

        <Button variant="primary" size="lg" disabled={!canStart} onClick={startSession}>
          セッションを開始
        </Button>
      </section>
    </main>
  )
}
