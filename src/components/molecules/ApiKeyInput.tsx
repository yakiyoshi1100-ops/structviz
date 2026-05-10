import { useState } from 'react'

import { IconButton } from '@/components/atoms'

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function ApiKeyInput({
  value,
  onChange,
  label = 'APIキー',
  placeholder = 'sk-ant-...',
}: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span>{label}</span>
      <div className="api-key-input">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <IconButton
          icon={visible ? '非' : '表'}
          label={visible ? 'APIキーを非表示' : 'APIキーを表示'}
          onClick={() => setVisible((current) => !current)}
        />
      </div>
    </label>
  )
}
