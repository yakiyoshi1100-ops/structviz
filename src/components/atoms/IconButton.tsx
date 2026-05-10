import type { ReactNode } from 'react'

interface IconButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

export function IconButton({ icon, label, onClick, active = false }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button${active ? ' icon-button--active' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}
