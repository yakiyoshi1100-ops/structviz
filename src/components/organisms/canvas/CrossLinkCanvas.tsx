import { useCallback, useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import { nanoid } from 'nanoid'

import type { CrossEdgeData, CrossLinkSlot } from '@/stores/crossLinkStore'
import type { StructuredNode } from '@/types'
import { FRAMEWORK_REGISTRY } from '@/types'
import { applyTreeLayout } from './layouts/treeLayout'
import { TreeNode, type TreeNodeData } from './nodes/TreeNode'

// ── 定数 ─────────────────────────────────────────────────────────────────────
// NODE_H は treeLayout.ts の NODE_HEIGHT と同値（90px）
const NODE_H      = 90
const SLOT_PAD    = 55   // ヘッダーからツリー上端までの余白
const SLOT_GAP    = 350  // スロット間の縦方向ギャップ（ノード重なり防止）
const HEADER_W    = 1400 // スロットヘッダーラベルの横幅

// TODO (item 4): ピラミッド・カード型フレームワークのネイティブレンダリング対応
// 現在はすべてのフレームワークを TreeNode（LRツリー）で表示
// 将来的には frameworkType に応じてノードタイプを切り替える

const nodeTypes = { treeNode: TreeNode }

const crossEdgeStyle = {
  stroke: '#f59e0b',
  strokeWidth: 2.5,
  strokeDasharray: '8 4',
}

// ── 型定義 ───────────────────────────────────────────────────────────────────
interface SlotLayout {
  laidOut: StructuredNode[] | null
  yHeader: number   // ヘッダーノードのY座標
  yStart:  number   // ツリー最上端のY座標
  yEnd:    number   // ツリー最下端（NODE_H込み）のY座標
  minNodeY: number  // laidOut中の最小Y（シフト量計算用）
}

interface CrossLinkCanvasProps {
  slots: CrossLinkSlot[]
  crossEdges: CrossEdgeData[]
  connectMode: boolean
  onAddCrossEdge: (edge: CrossEdgeData) => void
  /** クリック時に表示/非表示をトグル（削除しない） */
  onToggleCrossEdge: (edgeId: string) => void
}

export function CrossLinkCanvas({
  slots,
  crossEdges,
  connectMode,
  onAddCrossEdge,
  onToggleCrossEdge,
}: CrossLinkCanvasProps) {

  // ── 各スロットのレイアウト計算（動的yオフセット）─────────────────────────
  // ツリーの実際の高さに基づいてyOffsetを決定するため
  // スロット間のノード重なりを防ぐ
  const slotLayouts = useMemo<SlotLayout[]>(() => {
    const result: SlotLayout[] = []
    let cursor = 0  // 次のスロット開始Y（累積）

    slots.forEach((slot) => {
      // グラフ未生成 → プレースホルダー用の最小高さ
      if (!slot.graph || slot.graph.nodes.length === 0) {
        const phH = 90
        result.push({
          laidOut:  null,
          yHeader:  cursor,
          yStart:   cursor + SLOT_PAD,
          yEnd:     cursor + SLOT_PAD + phH,
          minNodeY: 0,
        })
        cursor += SLOT_PAD + phH + SLOT_GAP
        return
      }

      const laidOut = applyTreeLayout(slot.graph.nodes, slot.graph.edges, 'LR')

      if (laidOut.length === 0) {
        result.push({ laidOut: [], yHeader: cursor, yStart: cursor + SLOT_PAD, yEnd: cursor + SLOT_PAD, minNodeY: 0 })
        cursor += SLOT_PAD + SLOT_GAP
        return
      }

      // 実際のツリー高さを計測
      const yVals   = laidOut.map((n) => n.position.y)
      const minNodeY = Math.min(...yVals)
      const maxNodeY = Math.max(...yVals)
      const treeH   = maxNodeY - minNodeY + NODE_H  // 最下端ノードの底面まで

      const yStart = cursor + SLOT_PAD
      const yEnd   = yStart + treeH

      result.push({ laidOut, yHeader: cursor, yStart, yEnd, minNodeY })
      cursor = yEnd + SLOT_GAP
    })

    return result
  }, [slots])

  // ── ノード生成 ────────────────────────────────────────────────────────────
  const flowNodes = useMemo<Node[]>(() => {
    const out: Node[] = []

    slots.forEach((slot, i) => {
      const layout = slotLayouts[i]
      if (!layout) return

      if (!slot.graph || slot.graph.nodes.length === 0) {
        out.push({
          id: `placeholder_${slot.id}`,
          type: 'default',
          position: { x: 240, y: layout.yStart },
          draggable: false,
          selectable: false,
          data: {
            label: slot.frameworkType
              ? '「全スロット展開」でグラフを生成'
              : 'フレームワークを選択',
          },
          style: {
            background: 'transparent',
            border: '2px dashed #cbd5e1',
            color: '#94a3b8',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 13,
            width: 280,
            textAlign: 'center',
          },
        })
        return
      }

      const { laidOut, yStart, minNodeY } = layout
      if (!laidOut) return

      laidOut.forEach((node) => {
        out.push({
          id: `${slot.id}@@${node.id}`,
          type: 'treeNode',
          position: {
            x: node.position.x,
            y: node.position.y - minNodeY + yStart, // ツリーをyStartから始まるようシフト
          },
          draggable: false,
          connectable: connectMode,
          data: { node, onEdit: () => {} } satisfies TreeNodeData,
        })
      })
    })

    return out
  }, [slots, connectMode, slotLayouts])

  // ── エッジ生成 ────────────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(() => {
    const out: Edge[] = []

    // スロット内エッジ（親→子、LR smoothstep）
    slots.forEach((slot) => {
      if (!slot.graph) return
      slot.graph.edges.forEach((edge) => {
        out.push({
          id: `${slot.id}@@${edge.id}`,
          source: `${slot.id}@@${edge.source}`,
          target: `${slot.id}@@${edge.target}`,
          label: edge.label,
          type: 'smoothstep',
        })
      })
    })

    // クロスエッジ：hidden=true のものは描画しない
    crossEdges
      .filter((ce) => !ce.hidden)
      .forEach((ce) => {
        out.push({
          id: ce.id,
          source: ce.sourceNodeId,
          target: ce.targetNodeId,
          type: 'straight',
          style: crossEdgeStyle,
          label: ce.reason ?? '関連',
          labelStyle: { fontSize: 10, fill: '#f59e0b', fontWeight: 600 },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.85 },
        })
      })

    return out
  }, [slots, crossEdges])

  // ── ハンドラー ────────────────────────────────────────────────────────────
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const srcSlotId = connection.source.split('@@')[0]
      const tgtSlotId = connection.target.split('@@')[0]
      if (srcSlotId === tgtSlotId) return  // 同スロット内の接続は無視
      onAddCrossEdge({
        id: nanoid(),
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      })
    },
    [onAddCrossEdge],
  )

  // クロスエッジをクリック → 表示/非表示トグル（削除しない）
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (crossEdges.some((ce) => ce.id === edge.id)) {
        onToggleCrossEdge(edge.id)
      }
    },
    [crossEdges, onToggleCrossEdge],
  )

  // ── スロットヘッダーラベル ────────────────────────────────────────────────
  const headerNodes = useMemo<Node[]>(() => {
    const nodes: Node[] = []
    slots.forEach((slot, i) => {
      const layout = slotLayouts[i]
      if (!layout) return
      const label = slot.frameworkType
        ? `${FRAMEWORK_REGISTRY[slot.frameworkType].icon} ${FRAMEWORK_REGISTRY[slot.frameworkType].label}`
        : `スロット ${i + 1}`
      nodes.push({
        id: `header_${slot.id}`,
        type: 'default',
        position: { x: -20, y: layout.yHeader },
        draggable: false,
        selectable: false,
        data: { label },
        style: {
          background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 700,
          fontSize: 14,
          width: HEADER_W,
          textAlign: 'center',
          pointerEvents: 'none',
        },
      })
    })
    return nodes
  }, [slots, slotLayouts])

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      className={connectMode ? 'crosslink-connect-active' : ''}
    >
      <ReactFlow
        nodes={[...headerNodes, ...flowNodes]}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={connectMode}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.02}
        zoomOnScroll
        panOnDrag
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
