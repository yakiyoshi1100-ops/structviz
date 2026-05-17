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

const SLOT_WIDTH = 1400
const SLOT_GAP = 200

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
  // ---- ノード生成 ------------------------------------------------------------
  const flowNodes = useMemo<Node[]>(() => {
    const out: Node[] = []

    slots.forEach((slot, slotIndex) => {
      const xOffset = slotIndex * (SLOT_WIDTH + SLOT_GAP)

      if (!slot.graph || slot.graph.nodes.length === 0) {
        // グラフ未生成のプレースホルダーノード
        out.push({
          id: `placeholder_${slot.id}`,
          type: 'default',
          position: { x: xOffset + SLOT_WIDTH / 2 - 120, y: 0 },
          draggable: false,
          selectable: false,
          data: { label: slot.frameworkType ? '「展開する」でグラフを生成' : 'フレームワークを選択' },
          style: {
            background: 'transparent',
            border: '2px dashed #cbd5e1',
            color: '#94a3b8',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 13,
            width: 240,
            textAlign: 'center',
          },
        })
        return
      }

      // LR tree layoutを適用してXオフセット追加
      const laidOut = applyTreeLayout(slot.graph.nodes, slot.graph.edges, 'LR')

      laidOut.forEach((node) => {
        const nodeId = `${slot.id}_${node.id}`
        out.push({
          id: nodeId,
          type: 'treeNode',
          position: { x: node.position.x + xOffset, y: node.position.y },
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

  // ---- エッジ生成 ------------------------------------------------------------
  const flowEdges = useMemo<Edge[]>(() => {
    const out: Edge[] = []

    // スロット内エッジ
    slots.forEach((slot) => {
      if (!slot.graph) return
      slot.graph.edges.forEach((edge) => {
        out.push({
          id: `${slot.id}_${edge.id}`,
          source: `${slot.id}_${edge.source}`,
          target: `${slot.id}_${edge.target}`,
          label: edge.label,
          type: 'smoothstep',
        })
      })
    })

    // クロスエッジ（黄色破線）
    crossEdges.forEach((ce) => {
      out.push({
        id: ce.id,
        source: ce.sourceNodeId,
        target: ce.targetNodeId,
        type: 'straight',
        style: crossEdgeStyle,
        label: '関連',
        labelStyle: { fontSize: 11, fill: '#f59e0b' },
      })
    })

    return out
  }, [slots, crossEdges])

  // ---- ハンドラー ------------------------------------------------------------
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      // 同スロット内の接続は無視
      const srcSlot = connection.source.split('_')[0]
      const tgtSlot = connection.target.split('_')[0]
      if (srcSlot === tgtSlot) return
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

  // ---- スロットヘッダーラベル -----------------------------------------------
  const headerNodes = useMemo<Node[]>(() =>
    slots.map((slot, i) => {
      const xOffset = i * (SLOT_WIDTH + SLOT_GAP)
      const label = slot.frameworkType
        ? `${FRAMEWORK_REGISTRY[slot.frameworkType].icon} ${FRAMEWORK_REGISTRY[slot.frameworkType].label}`
        : `スロット ${i + 1}`
      return {
        id: `header_${slot.id}`,
        type: 'default',
        position: { x: xOffset, y: -120 },
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
          width: SLOT_WIDTH,
          textAlign: 'center',
          pointerEvents: 'none',
        },
      }
    }),
  [slots])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={[...headerNodes, ...flowNodes]}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={connectMode}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.04}
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
