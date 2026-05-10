import type { ReactNode } from 'react'

interface FacilitatorLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  inputPanel: ReactNode
  unclassifiedBuffer: ReactNode
}

export function FacilitatorLayout({
  header,
  sidebar,
  canvas,
  inputPanel,
  unclassifiedBuffer,
}: FacilitatorLayoutProps) {
  return (
    <main className="facilitator-layout">
      <div className="facilitator-header">{header}</div>
      <div className="facilitator-sidebar">{sidebar}</div>
      <section className="facilitator-main">
        <div className="canvas-area">
          {canvas}
          {unclassifiedBuffer}
        </div>
        {inputPanel}
      </section>
    </main>
  )
}
