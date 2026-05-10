import type { SpeechStatus } from '@/hooks/useSpeechRecognition'

interface MicButtonProps {
  status: SpeechStatus
  onToggle: () => void
  isSupported: boolean
}

export function MicButton({ status, onToggle, isSupported }: MicButtonProps) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="このブラウザは音声入力に対応していません（Chrome/Edgeを推奨）"
        className="mic-button"
        aria-label="音声入力非対応"
      >
        🎤
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mic-button${status === 'listening' ? ' mic-button--active' : ''}${status === 'error' ? ' mic-button--error' : ''}`}
      title={status === 'listening' ? '録音停止' : '音声入力開始'}
      aria-label={status === 'listening' ? '録音停止' : '音声入力開始'}
      aria-pressed={status === 'listening'}
    >
      {status === 'listening' ? '⏹' : '🎤'}
    </button>
  )
}
