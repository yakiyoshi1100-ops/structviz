import { useEffect, useRef, useState } from 'react'

import { Button, TextArea } from '@/components/atoms'
import { FileUploadTab, MicButton } from '@/components/molecules'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

type InputTab = 'text' | 'mic' | 'file'

interface InputPanelProps {
  text: string
  isClassifying: boolean
  onChange: (text: string) => void
  onStructurize: () => void
  onClear: () => void
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
  const textRef = useRef(text)

  useEffect(() => {
    textRef.current = text
  }, [text])

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

  return (
    <section className="input-panel input-panel--tabs">
      <div className="input-tabs" role="tablist" aria-label="入力方法">
        <button
          type="button"
          role="tab"
          className={`input-tab${activeTab === 'text' ? ' input-tab--active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📝 テキスト
        </button>
        <button
          type="button"
          role="tab"
          className={`input-tab${activeTab === 'mic' ? ' input-tab--active' : ''}`}
          onClick={() => setActiveTab('mic')}
        >
          🎤 マイク
        </button>
        <button
          type="button"
          role="tab"
          className={`input-tab${activeTab === 'file' ? ' input-tab--active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          📁 ファイル
        </button>
      </div>

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
              value={text}
              rows={activeTab === 'mic' ? 6 : 8}
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
              <MicButton status={status} onToggle={toggleListening} isSupported={isSupported} />
            )}
            <Button
              variant="primary"
              loading={isClassifying}
              onClick={onStructurize}
              disabled={!text.trim()}
            >
              構造化
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
