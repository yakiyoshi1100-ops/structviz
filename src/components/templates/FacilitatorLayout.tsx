import type { ReactNode } from 'react'

interface FacilitatorLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  inputPanel: ReactNode
  sidebarCollapsed?: boolean
}

export function FacilitatorLayout({
  header,
  sidebar,
  canvas,
  inputPanel,
  sidebarCollapsed = false,
}: FacilitatorLayoutProps) {
  const gridCols = sidebarCollapsed ? '48px minmax(0, 1fr)' : '280px minmax(0, 1fr)'

  return (
    <main className="facilitator-layout" style={{ gridTemplateColumns: gridCols }}>
      <div className="facilitator-header">{header}</div>
      <div className="facilitator-sidebar">{sidebar}</div>
      <section className="facilitator-main">
        <div className="canvas-area">{canvas}</div>
        {inputPanel}
      </section>
    </main>
  )
}
