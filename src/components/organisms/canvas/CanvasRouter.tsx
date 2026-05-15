import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { MindmapCanvas } from './MindmapCanvas'
import { MatrixCanvas } from './MatrixCanvas'
import { PyramidCanvas } from './PyramidCanvas'
import { TreeCanvas } from './TreeCanvas'

interface CanvasRouterProps {
  graph: FrameworkGraph | null
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onDropUnclassified: (nodeId: string, role: NodeRole) => void
}

const matrixFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.THREE_C,
  FrameworkType.PEST,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.AS_IS_TO_BE,
  FrameworkType.BUSINESS_FLOW,
  FrameworkType.ECRS,
  FrameworkType.FOUR_M,
  FrameworkType.QCD,
  FrameworkType.STP,
  FrameworkType.PPM,
  FrameworkType.BSC,
  FrameworkType.ABC,
  FrameworkType.RACI,
  FrameworkType.YWT,
  FrameworkType.SPIN,
  FrameworkType.CUSTOMER_JOURNEY,
  FrameworkType.VSM,
  FrameworkType.DMAIC,
])

export function CanvasRouter({
  graph,
  onNodeMove,
  onNodeEdit,
  onDropUnclassified,
}: CanvasRouterProps) {
  if (!graph) {
    return (
      <div className="canvas-placeholder">
        フレームワークを選択してテキストを入力してください
      </div>
    )
  }

  if (graph.frameworkType === FrameworkType.WHY_TREE) {
    return <MindmapCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (graph.frameworkType === FrameworkType.PYRAMID) {
    return <PyramidCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (matrixFrameworks.has(graph.frameworkType)) {
    return <MatrixCanvas graph={graph} onNodeMove={onNodeMove} onNodeEdit={onNodeEdit} />
  }

  return (
    <TreeCanvas
      graph={graph}
      onNodeMove={onNodeMove}
      onNodeEdit={onNodeEdit}
      onDropUnclassified={onDropUnclassified}
    />
  )
}
