interface TextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  autoFocus?: boolean
  onCommit?: () => void
}

export function TextArea({
  value,
  onChange,
  placeholder,
  className,
  rows = 6,
  autoFocus = false,
  onCommit,
}: TextAreaProps) {
  return (
    <textarea
      className={className ? `textarea ${className}` : 'textarea'}
      value={value}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault()
          onCommit?.()
        }
      }}
    />
  )
}
