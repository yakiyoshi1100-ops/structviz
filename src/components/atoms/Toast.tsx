import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'success' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`} role="status">
      <span>{message}</span>
      <button type="button" aria-label="通知を閉じる" onClick={onClose}>
        ×
      </button>
    </div>
  )
}
