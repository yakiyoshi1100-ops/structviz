import { useEffect, useRef, useState } from 'react'

import { Button, TextArea } from '@/components/atoms'
import { FileUploadTab, MicButton } from '@/components/molecules'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useConfigStore, useUiStore } from '@/stores'

type InputTab = 'text' | 'mic' | 'file'

interface InputPanelProps {
  text: string
  isClassifying: boolean
  onChange: (text: string) => void
  onStructurize: () => void
  onClear: () => void
}

const TAB_LABELS: Record<InputTab, string> = {
  text: 'テキスト',
  mic: 'マイク',
  file: 'ファイル',
}

const TAB_ICONS: Record<InputTab, string> = {
  text: '✎',
  mic: '◉',
  file: '▣',
}

export function InputPanel({
  text,
  isClassifying,
  onChange,
  onStructurize,
  onClear,
}: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('text')
  const [interimText, setInterimText] = useState('')
  const mode = useConfigStore((state) => state.mode)
  const inputPanelExpanded = useUiStore((state) => state.inputPanelExpanded)
  const toggleInputPanel = useUiStore((state) => state.toggleInputPanel)
  const textRef = useRef(text)
  const wasClassifyingRef = useRef(false)

  useEffect(() => {
    textRef.current = text
  }, [text])

  useEffect(() => {
    if (wasClassifyingRef.current && !isClassifying && inputPanelExpanded) {
      toggleInputPanel()
    }

    wasClassifyingRef.current = isClassifying
  }, [inputPanelExpanded, isClassifying, toggleInputPanel])

  const appendText = (nextText: string) => {
    const trimmed = nextText.trim()

    if (!trimmed) {
      return
    }

    const nextValue = textRef.current + (textRef.current ? '。' : '') + trimmed
    textRef.current = nextValue
    onChange(nextValue)
  }

  const { status, errorMessage, toggleListening, isSupported } = useSpeechRecognition(
    (transcript, isFinal) => {
      if (isFinal) {
        appendText(transcript)
        setInterimText('')
      } else {
        setInterimText(transcript)
      }
    },
  )

  const actionLabel = mode === 'ai' ? 'AIで構造化' : '構造化する'

  return (
    <section
      className={`input-panel input-panel--tabs sv-inputpanel${inputPanelExpanded ? ' input-panel--expanded' : ' input-panel--collapsed'}`}
      role="region"
      aria-label="入力パネル"
    >
      <button type="button" className="input-panel-toggle" onClick={toggleInputPanel}>
        <span>{inputPanelExpanded ? '▼ 入力' : '▲ 入力'}</span>
        <span>{inputPanelExpanded ? '折りたたむ' : '展開する'}</span>
      </button>

      {inputPanelExpanded && (
        <div className="input-panel-content expanded">
          <div className="input-tabs sv-tabs" role="tablist" aria-label="入力方法">
            {(['text', 'mic', 'file'] as InputTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`input-tab sv-tab${activeTab === tab ? ' input-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="sv-tab__icon" aria-hidden>
                  {TAB_ICONS[tab]}
                </span>
                <span>{TAB_LABELS[tab]}</span>
              </button>
            ))}
          </div>

          <div className="sv-tabpanel">
            {activeTab === 'file' ? (
              <FileUploadTab
                onTranscribed={(transcribedText) => {
                  appendText(transcribedText)
                  setActiveTab('text')
                }}
              />
            ) : (
              <>
                <div className="input-textarea-block">
                  <TextArea
                    className="sv-textarea"
                    value={text}
                    rows={activeTab === 'mic' ? 5 : 6}
                    placeholder="構造化したい文章を入力してください"
                    onChange={onChange}
                    onCommit={onStructurize}
                  />
                  <div className={`interim-text${errorMessage ? ' interim-text--error' : ''}`}>
                    {activeTab === 'mic' ? errorMessage ?? interimText : ''}
                  </div>
                </div>
                <div className="input-actions">
                  <Button variant="ghost" onClick={onClear} disabled={!text || isClassifying}>
                    クリア
                  </Button>
                  {activeTab === 'mic' && (
                    <MicButton
                      status={status}
                      onToggle={toggleListening}
                      isSupported={isSupported}
                    />
                  )}
                  <Button
                    variant="primary"
                    loading={isClassifying}
                    onClick={onStructurize}
                    disabled={!text.trim()}
                  >
                    {actionLabel}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
