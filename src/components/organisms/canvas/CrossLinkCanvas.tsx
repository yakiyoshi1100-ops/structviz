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
import { FRAMEWORK_REGISTRY } from '@/types'
import { applyTreeLayout } from './layouts/treeLayout'
import { TreeNode, type TreeNodeData } from './nodes/TreeNode'

// ── レイアウト定数 ──────────────────────────────────────────────────────────
// スロットを縦積みすることで、同じ深さのノードが同じX座標に揃い
// クロスエッジが縦方向（≒平行）になって視覚的な交差が大幅に減少する
const SLOT_HEIGHT = 1600  // スロット1つ分の縦幅（ツリーがここに収まる）
const SLOT_GAP   = 400   // スロット間の縦方向ギャップ
const HEADER_W   = 1400  // スロットヘッダーラベルの横幅

// TODO (item 4): ピラミッド・カード型フレームワークのネイティブレンダリング対応
// 現在はすべてのフレームワークをTreeNode（LRツリー）で表示
// 将来的には frameworkType に応じてノードタイプを切り替える

const nodeTypes = { treeNode: TreeNode }

const crossEdgeStyle = {
  stroke: '#f59e0b',
  strokeWidth: 2,
  strokeDasharray: '8 4',
}

interface CrossLinkCanvasProps {
  slots: CrossLinkSlot[]
  crossEdges: CrossEdgeData[]
  connectMode: boolean
  onAddCrossEdge: (edge: CrossEdgeData) => void
  onRemoveCrossEdge: (edgeId: string) => void
}

export function CrossLinkCanvas({
  slots,
  crossEdges,
  connectMode,
  onAddCrossEdge,
  onRemoveCrossEdge,
}: CrossLinkCanvasProps) {
  // ── ノード生成 ────────────────────────────────────────────────────────────
  const flowNodes = useMemo<Node[]>(() => {
    const out: Node[] = []

    slots.forEach((slot, slotIndex) => {
      // スロットごとの縦オフセット（スロット0が最上部）
      const yOffset = slotIndex * (SLOT_HEIGHT + SLOT_GAP)

      if (!slot.graph || slot.graph.nodes.length === 0) {
        // プレースホルダーノード（ツリー未生成時）
        out.push({
          id: `placeholder_${slot.id}`,
          type: 'default',
          position: { x: 240, y: yOffset - 45 },
          draggable: false,
          selectable: false,
          data: {
            label: slot.frameworkType ? '「全スロット展開」でグラフを生成' : 'フレームワークを選択',
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

      // LR ツリーレイアウトを適用 → Y方向はツリー固有（中心=0）→ yOffset を加算
      // セパレータに @@（nanoidは @ を使わないため衝突しない）
      const laidOut = applyTreeLayout(slot.graph.nodes, slot.graph.edges, 'LR')

      laidOut.forEach((node) => {
        const nodeId = `${slot.id}@@${node.id}`
        out.push({
          id: nodeId,
          type: 'treeNode',
          position: {
            x: node.position.x,          // 深さ方向（右へ伸びる）
            y: node.position.y + yOffset, // 縦積みオフセットを加算
          },
          draggable: false,
          connectable: connectMode,
          data: {
            node,
            onEdit: () => {},
          } satisfies TreeNodeData,
        })
      })
    })

    return out
  }, [slots, connectMode])

  // ── エッジ生成 ────────────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(() => {
    const out: Edge[] = []

    // スロット内エッジ（同じ深さ間の親→子）
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

    // クロスエッジ（黄色破線）
    // 縦積みレイアウトにより同深度ノードが同X座標に揃うため
    // クロスエッジは縦方向（≒平行）になり交差が少ない
    crossEdges.forEach((ce) => {
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
      // 同スロット内接続は無視
      if (srcSlotId === tgtSlotId) return
      onAddCrossEdge({
        id: nanoid(),
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      })
    },
    [onAddCrossEdge],
  )

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (crossEdges.some((ce) => ce.id === edge.id)) {
        onRemoveCrossEdge(edge.id)
      }
    },
    [crossEdges, onRemoveCrossEdge],
  )

  // ── スロットヘッダーラベル（各スロットの左上） ────────────────────────────
  const headerNodes = useMemo<Node[]>(() =>
    slots.map((slot, i) => {
      const yOffset = i * (SLOT_HEIGHT + SLOT_GAP)
      const label = slot.frameworkType
        ? `${FRAMEWORK_REGISTRY[slot.frameworkType].icon} ${FRAMEWORK_REGISTRY[slot.frameworkType].label}`
        : `スロット ${i + 1}`
      return {
        id: `header_${slot.id}`,
        type: 'default',
        // ツリーの上端（SLOT_HEIGHT/2 + マージン）に配置
        position: { x: -20, y: yOffset - SLOT_HEIGHT / 2 - 60 },
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
      }
    }),
  [slots])

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
