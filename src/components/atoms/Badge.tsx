interface BadgeProps {
  label: string
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray'
}

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return <span className={`badge badge--${color}`}>{label}</span>
}
