import { useRef, useState } from 'react'

import { Button } from '@/components/atoms'
import { useFileTranscription } from '@/hooks/useFileTranscription'

interface FileUploadTabProps {
  onTranscribed: (text: string) => void
}

const ACCEPTED_AUDIO_TYPES = '.mp3,.wav,.m4a,.webm,.mp4'
const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface FileCheckResult {
  ok: boolean
  message: string
  severity: 'ok' | 'warning' | 'error'
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function statusLabel(status: ReturnType<typeof useFileTranscription>['status']): string {
  if (status === 'uploading') return 'uploading...'
  if (status === 'done') return 'done'
  if (status === 'error') return 'error'
  return ''
}

function checkFile(file: File): FileCheckResult {
  const sizeMB = file.size / 1024 / 1024

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      severity: 'error',
      message: `このファイルは処理できません。サイズ ${sizeMB.toFixed(1)}MB がOpenAI APIの上限（25MB）を超えています。ファイルを分割してください。`,
    }
  }

  if (sizeMB > 15) {
    return {
      ok: true,
      severity: 'warning',
      message: `ファイルサイズ ${sizeMB.toFixed(1)}MB。文字起こしに数分かかる場合があります。`,
    }
  }

  if (sizeMB > 5) {
    return {
      ok: true,
      severity: 'warning',
      message: `ファイルサイズ ${sizeMB.toFixed(1)}MB。文字起こしに1〜2分かかる場合があります。`,
    }
  }

  return {
    ok: true,
    severity: 'ok',
    message: `${sizeMB.toFixed(1)}MB。処理可能です。`,
  }
}

export function FileUploadTab({ onTranscribed }: FileUploadTabProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileCheck, setFileCheck] = useState<FileCheckResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { status, progress, errorMessage, transcribe, cancel } = useFileTranscription(onTranscribed)
  const isWorking = status === 'uploading' || status === 'transcribing'
  const fileSizeMB = file ? file.size / 1024 / 1024 : 0

  const selectFile = (nextFile?: File) => {
    if (!nextFile) {
      return
    }

    setFileCheck(checkFile(nextFile))
    setFile(nextFile)
  }

  return (
    <div className="file-upload-tab">
      <button
        type="button"
        className={`file-drop-area sv-drop${isDragOver ? ' file-drop-area--dragover' : ''}`}
        data-over={isDragOver ? 'true' : 'false'}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragOver(false)
          selectFile(event.dataTransfer.files[0])
        }}
      >
        <span className="file-drop-area__icon sv-drop__icon" aria-hidden>
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
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M5 20h14" />
          </svg>
        </span>
        <span className="file-drop-area__label sv-drop__primary">
          音声ファイルをドロップ または クリックして選択
        </span>
        <span className="file-drop-area__formats sv-drop__secondary">
          対応形式: .mp3 / .wav / .m4a / .webm / .mp4
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AUDIO_TYPES}
        hidden
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      {file && (
        <>
          <div className="file-selected">
            <span aria-hidden>♪</span>
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)}</span>
          </div>
          {fileCheck && (
            <div className={`file-check-message file-check-message--${fileCheck.severity}`}>
              {fileCheck.message}
            </div>
          )}
        </>
      )}

      {(status !== 'idle' || errorMessage) && (
        <div
          className={`transcription-status${status === 'error' ? ' transcription-status--error' : ''}${status === 'done' ? ' transcription-status--done' : ''}`}
        >
          <span>
            {status === 'transcribing'
              ? `文字起こし中... ${fileSizeMB.toFixed(1)}MBのファイルは最大10分かかる場合があります`
              : statusLabel(status)}
          </span>
          {isWorking && <progress value={progress} max={100} />}
          {errorMessage && <span>{errorMessage}</span>}
        </div>
      )}

      <div className="input-actions file-upload-actions">
        {isWorking && (
          <Button variant="secondary" onClick={cancel}>
            キャンセル
          </Button>
        )}
        <Button
          variant="primary"
          loading={isWorking}
          disabled={!file || !fileCheck?.ok || isWorking}
          onClick={() => {
            if (file) {
              void transcribe(file)
            }
          }}
        >
          文字起こし開始
        </Button>
      </div>
    </div>
  )
}
