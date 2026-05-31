import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { MatrixCanvas } from './MatrixCanvas'
import { AsIsToBeCanvas } from './AsIsToBeCanvas'
import { BusinessFlowCanvas } from './BusinessFlowCanvas'
import { MeceCanvas } from './MeceCanvas'
import { PyramidCanvas } from './PyramidCanvas'
import { TreeCanvas } from './TreeCanvas'
import { WBSCanvas } from './WBSCanvas'
import { FishboneCanvas } from './FishboneCanvas'
import { CustomerJourneyCanvas } from './CustomerJourneyCanvas'
import { KPICanvas } from './KPICanvas'
import { PhenomenonToActionCanvas } from './PhenomenonToActionCanvas'
import { LogicCanvas } from './LogicCanvas'
import { ThreeCCanvas } from './ThreeCCanvas'
import { PESTCanvas } from './PESTCanvas'
import { ZoomPanCanvas } from './ZoomPanCanvas'
import { RACICanvas } from './RACICanvas'
import { VSMCanvas } from './VSMCanvas'
import { BSCCanvas } from './BSCCanvas'
import { DMAICCanvas } from './DMAICCanvas'
import { ECRSCanvas } from './ECRSCanvas'
import { FourMCanvas } from './FourMCanvas'
import { QCDCanvas } from './QCDCanvas'

interface CanvasRouterProps {
  graph: FrameworkGraph | null
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onDropUnclassified: (nodeId: string, role: NodeRole) => void
}

// MatrixCanvas が処理するフレームワーク
const matrixFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.STP,
  FrameworkType.PPM,
  FrameworkType.ABC,
  FrameworkType.YWT,
  FrameworkType.SPIN,
])

// 純CSSキャンバスを ZoomPanCanvas でラップするヘルパー
function withZoom(canvas: React.ReactElement) {
  return <ZoomPanCanvas>{canvas}</ZoomPanCanvas>
}

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

  // ── 専用キャンバス（ZoomPan ラップ済み） ────────────────────────────────
  if (graph.frameworkType === FrameworkType.THREE_C) {
    return withZoom(<ThreeCCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.PEST) {
    return withZoom(<PESTCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.AS_IS_TO_BE) {
    return withZoom(
      <AsIsToBeCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />
    )
  }

  if (graph.frameworkType === FrameworkType.BUSINESS_FLOW) {
    return withZoom(
      <BusinessFlowCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />
    )
  }

  if (graph.frameworkType === FrameworkType.MECE) {
    return withZoom(<MeceCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.CUSTOMER_JOURNEY) {
    return withZoom(<CustomerJourneyCanvas graph={graph} />)
  }

  if (graph.frameworkType === FrameworkType.RACI) {
    return withZoom(
      <RACICanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />
    )
  }

  if (graph.frameworkType === FrameworkType.VSM) {
    return <VSMCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />
  }

  if (graph.frameworkType === FrameworkType.BSC) {
    return withZoom(<BSCCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />)
  }

  if (graph.frameworkType === FrameworkType.DMAIC) {
    return withZoom(<DMAICCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.ECRS) {
    return withZoom(<ECRSCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.FOUR_M) {
    return withZoom(<FourMCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.QCD) {
    return withZoom(<QCDCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  // ── Pyramid / Tree 系（ZoomPan ラップ済み） ─────────────────────────────
  if (graph.frameworkType === FrameworkType.PYRAMID) {
    return withZoom(<PyramidCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  // ── ReactFlow 系（自前でズーム・パン・FitView あり） ────────────────────
  if (graph.frameworkType === FrameworkType.WBS) {
    return <WBSCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (graph.frameworkType === FrameworkType.FISHBONE) {
    return <FishboneCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (graph.frameworkType === FrameworkType.KPI) {
    return <KPICanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (graph.frameworkType === FrameworkType.PHENOMENON_TO_ACTION) {
    return <PhenomenonToActionCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  if (
    graph.frameworkType === FrameworkType.DEDUCTION ||
    graph.frameworkType === FrameworkType.INDUCTION
  ) {
    return <LogicCanvas graph={graph} onNodeEdit={onNodeEdit} />
  }

  // ── MatrixCanvas 系（ZoomPan ラップ済み） ────────────────────────────────
  if (matrixFrameworks.has(graph.frameworkType)) {
    return withZoom(
      <MatrixCanvas graph={graph} onNodeMove={onNodeMove} onNodeEdit={onNodeEdit} />
    )
  }

  // ── TreeCanvas（ZoomPan ラップ済み） ─────────────────────────────────────
  return withZoom(
    <TreeCanvas
      graph={graph}
      onNodeMove={onNodeMove}
      onNodeEdit={onNodeEdit}
      onDropUnclassified={onDropUnclassified}
    />
  )
}
