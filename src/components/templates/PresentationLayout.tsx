import type { ReactNode } from 'react'

import { Button } from '@/components/atoms'
import { useConfigStore } from '@/stores'

interface PresentationLayoutProps {
  canvas: ReactNode
  floatingInput: ReactNode
}

export function PresentationLayout({ canvas, floatingInput }: PresentationLayoutProps) {
  const setViewMode = useConfigStore((state) => state.setViewMode)

  return (
    <main className="presentation-layout">
      <Button variant="secondary" onClick={() => setViewMode('facilitator')}>
        ← ファシリテーターモードに戻る
      </Button>
      <div className="presentation-canvas">{canvas}</div>
      {floatingInput}
    </main>
  )
}
