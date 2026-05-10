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
    <main className="mode-page">
      <section className="mode-shell">
        <header className="mode-header">
          <span>StructViz</span>
          <h1>構造化する作業を始める</h1>
        </header>

        <div className="mode-grid">
          <button
            type="button"
            className={`mode-card${selectedMode === 'standalone' ? ' mode-card--active' : ''}`}
            onClick={() => setSelectedMode('standalone')}
          >
            <strong>スタンドアロン</strong>
            <span>ブラウザ内のルールベース分類で、すぐに構造化します。</span>
          </button>
          <button
            type="button"
            className={`mode-card${selectedMode === 'ai' ? ' mode-card--active' : ''}`}
            onClick={() => setSelectedMode('ai')}
          >
            <strong>AIモード</strong>
            <span>Claude API を使って、文脈を踏まえた分類を行います。</span>
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
