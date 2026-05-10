import { useEffect, useRef } from 'react'

import { Badge, IconButton } from '@/components/atoms'
import { ExportMenu, ModeToggle } from '@/components/molecules'
import {
  FloatingInputPanel,
  FrameworkSidebar,
  InputPanel,
  SettingsPanel,
  ToastContainer,
  UnclassifiedBuffer,
} from '@/components/organisms'
import { CanvasRouter } from '@/components/organisms/canvas'
import { FacilitatorLayout, PresentationLayout } from '@/components/templates'
import { useClassification } from '@/hooks/useClassification'
import { useExport } from '@/hooks/useExport'
import { useShortcuts } from '@/hooks/useShortcuts'
import {
  selectIsAiReady,
  selectUnclassified,
  useConfigStore,
  useSessionStore,
  useUiStore,
} from '@/stores'
import type { FrameworkType, NodeRole, StructuredNode } from '@/types'

export function WorkspacePage() {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const activeFramework = useSessionStore((state) => state.activeFramework)
  const graph = useSessionStore((state) => state.graph)
  const currentInput = useSessionStore((state) => state.currentInput)
  const isClassifying = useSessionStore((state) => state.isClassifying)
  const setInput = useSessionStore((state) => state.setInput)
  const setFramework = useSessionStore((state) => state.setFramework)
  const setGraph = useSessionStore((state) => state.setGraph)
  const moveNode = useSessionStore((state) => state.moveNode)
  const updateNode = useSessionStore((state) => state.updateNode)
  const promoteFromUnclassified = useSessionStore((state) => state.promoteFromUnclassified)
  const unclassified = useSessionStore(selectUnclassified)
  const viewMode = useConfigStore((state) => state.viewMode)
  const setViewMode = useConfigStore((state) => state.setViewMode)
  const setLastFramework = useConfigStore((state) => state.setLastFramework)
  const isAiReady = useConfigStore(selectIsAiReady)
  const mode = useConfigStore((state) => state.mode)
  const floatingPanelCollapsed = useUiStore((state) => state.floatingPanelCollapsed)
  const settingsPanelOpen = useUiStore((state) => state.settingsPanelOpen)
  const setFloatingCollapsed = useUiStore((state) => state.setFloatingCollapsed)
  const toggleSettings = useUiStore((state) => state.toggleSettings)
  const { onStructurize } = useClassification()
  const { onExport } = useExport(canvasRef)

  useShortcuts({ onStructurize })

  useEffect(() => {
    document.body.classList.toggle('presentation-mode', viewMode === 'presentation')

    return () => {
      document.body.classList.remove('presentation-mode')
    }
  }, [viewMode])

  const selectFramework = (framework: FrameworkType) => {
    setFramework(framework)
    setLastFramework(framework)
    setGraph(null)
  }

  const canvas = (
    <div ref={canvasRef} className="canvas-export-root">
      <CanvasRouter
        graph={graph}
        onNodeMove={moveNode}
        onDropUnclassified={(nodeId: string, role: NodeRole) =>
          promoteFromUnclassified(nodeId, role)
        }
        onNodeEdit={(nodeId, patch: Partial<Omit<StructuredNode, 'id'>>) =>
          updateNode(nodeId, patch)
        }
      />
    </div>
  )

  const inputPanel = (
    <InputPanel
      text={currentInput}
      isClassifying={isClassifying}
      onChange={setInput}
      onStructurize={onStructurize}
      onClear={() => setInput('')}
    />
  )

  const floatingInput = (
    <FloatingInputPanel
      text={currentInput}
      isClassifying={isClassifying}
      onChange={setInput}
      onStructurize={onStructurize}
      onClear={() => setInput('')}
      collapsed={floatingPanelCollapsed}
      onToggleCollapse={() => setFloatingCollapsed(!floatingPanelCollapsed)}
    />
  )

  const unclassifiedBuffer = (
    <UnclassifiedBuffer
      nodes={unclassified}
      onDropToCanvas={(nodeId, role) => promoteFromUnclassified(nodeId, role)}
    />
  )

  const header = (
    <header className="workspace-header">
      <strong>StructViz</strong>
      <div className="workspace-header-actions">
        <ModeToggle mode={viewMode} onChange={setViewMode} aiReady={isAiReady} />
        {mode === 'ai' && <Badge label="AIモード" color="purple" />}
        <ExportMenu onExport={onExport} disabled={!graph} />
        <IconButton icon="⚙" label="設定" onClick={toggleSettings} />
      </div>
    </header>
  )

  const sidebar = <FrameworkSidebar active={activeFramework} onSelect={selectFramework} />
  const overlays = (
    <>
      <SettingsPanel open={settingsPanelOpen} onClose={toggleSettings} />
      <ToastContainer />
    </>
  )

  if (viewMode === 'presentation') {
    return (
      <>
        <PresentationLayout canvas={canvas} floatingInput={floatingInput} />
        {overlays}
      </>
    )
  }

  return (
    <>
      <FacilitatorLayout
        header={header}
        sidebar={sidebar}
        canvas={canvas}
        inputPanel={inputPanel}
        unclassifiedBuffer={unclassifiedBuffer}
      />
      {overlays}
    </>
  )
}
