import type { ReactNode } from 'react'

import { Spinner } from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant} button--${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
