import { useEffect, useRef, useState } from 'react'

import { Button, IconButton, TextArea } from '@/components/atoms'
import { MicButton } from '@/components/molecules'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface FloatingInputPanelProps {
  text: string
  isClassifying: boolean
  onChange: (text: string) => void
  onStructurize: () => void
  onClear: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function FloatingInputPanel({
  text,
  isClassifying,
  onChange,
  onStructurize,
  onClear,
  collapsed,
  onToggleCollapse,
}: FloatingInputPanelProps) {
  const [interimText, setInterimText] = useState('')
  const textRef = useRef(text)

  useEffect(() => {
    textRef.current = text
  }, [text])

  const { status, errorMessage, toggleListening, isSupported } = useSpeechRecognition(
    (transcript, isFinal) => {
      if (isFinal) {
        const nextText = textRef.current + (textRef.current ? '。' : '') + transcript
        textRef.current = nextText
        onChange(nextText)
        setInterimText('')
      } else {
        setInterimText(transcript)
      }
    },
  )

  if (collapsed) {
    return (
      <button
        type="button"
        className="floating-input-fab"
        aria-label="入力パネルを開く"
        onClick={onToggleCollapse}
      >
        ✎
      </button>
    )
  }

  return (
    <section className="floating-input-panel">
      <header>
        <strong>入力</strong>
        <IconButton icon="−" label="入力パネルを折りたたむ" onClick={onToggleCollapse} />
      </header>
      <div className="input-textarea-block">
        <TextArea
          value={text}
          rows={6}
          placeholder="構造化したい文章を入力してください"
          onChange={onChange}
          onCommit={onStructurize}
        />
        <div className={`interim-text${errorMessage ? ' interim-text--error' : ''}`}>
          {errorMessage ?? interimText}
        </div>
      </div>
      <div className="input-actions">
        <Button variant="ghost" onClick={onClear} disabled={!text || isClassifying}>
          クリア
        </Button>
        <MicButton status={status} onToggle={toggleListening} isSupported={isSupported} />
        <Button
          variant="primary"
          loading={isClassifying}
          onClick={onStructurize}
          disabled={!text.trim()}
        >
          構造化
        </Button>
      </div>
    </section>
  )
}
