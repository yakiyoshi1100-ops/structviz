import { useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowProps,
} from '@xyflow/react'

import type { FrameworkGraph, StructuredNode } from '@/types'

interface PyramidCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

const ROLE_ORDER = ['conclusion', 'argument', 'evidence', 'root', 'branch', 'leaf']
const NODE_WIDTH = {
  conclusion: 350,
  argument: 280,
  evidence: 280,
} as const

function groupNodes(nodes: StructuredNode[]) {
  const conclusion = nodes.filter((node) => ['conclusion', 'root'].includes(node.role))
  const arguments_ = nodes.filter((node) => ['argument', 'branch'].includes(node.role))
  const evidence = nodes.filter((node) => ['evidence', 'leaf'].includes(node.role))
  const used = new Set([...conclusion, ...arguments_, ...evidence].map((node) => node.id))
  const rest = nodes
    .filter((node) => !used.has(node.id))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))

  return {
    conclusion: conclusion.length > 0 ? conclusion.slice(0, 1) : nodes.slice(0, 1),
    arguments: arguments_.length > 0 ? arguments_ : rest.slice(0, 4),
    evidence: evidence.length > 0 ? evidence : rest.slice(arguments_.length > 0 ? 0 : 4),
  }
}

function gridPosition(index: number, y: number) {
  const col = index % 2
  const row = Math.floor(index / 2)
  return {
    x: col === 0 ? -320 : 40,
    y: y + row * 116,
  }
}

function pyramidNode(
  node: StructuredNode,
  layer: 'conclusion' | 'argument' | 'evidence',
  position: { x: number; y: number },
): Node {
  return {
    id: node.id,
    position,
    draggable: true,
    data: { label: node.label },
    className: `pyramid-flow-node pyramid-flow-node--${layer}`,
    style: {
      width: NODE_WIDTH[layer],
    },
  }
}

export function PyramidCanvas({ graph, onNodeEdit }: PyramidCanvasProps) {
  const grouped = useMemo(() => groupNodes(graph.nodes), [graph.nodes])

  const flowNodes = useMemo<Node[]>(() => {
    const argumentRows = Math.max(1, Math.ceil(grouped.arguments.length / 2))
    const evidenceStartY = 210 + argumentRows * 116

    return [
      ...grouped.conclusion.map((node) =>
        pyramidNode(node, 'conclusion', { x: -NODE_WIDTH.conclusion / 2, y: 0 }),
      ),
      ...grouped.arguments.map((node, index) => pyramidNode(node, 'argument', gridPosition(index, 150))),
      ...grouped.evidence.map((node, index) =>
        pyramidNode(node, 'evidence', gridPosition(index, evidenceStartY)),
      ),
    ]
  }, [grouped])

  const flowEdges = useMemo<Edge[]>(() => {
    const root = grouped.conclusion[0]

    if (!root) return []

    const argumentEdges = grouped.arguments.map((node) => ({
      id: `${root.id}-${node.id}`,
      source: root.id,
      target: node.id,
      type: 'smoothstep',
    }))

    const evidenceEdges = grouped.evidence.map((node, index) => {
      const parent = grouped.arguments[index % Math.max(grouped.arguments.length, 1)] ?? root
      return {
        id: `${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: 'smoothstep',
      }
    })

    return [...argumentEdges, ...evidenceEdges]
  }, [grouped])

  const handleNodeDoubleClick: NonNullable<ReactFlowProps['onNodeDoubleClick']> = (_event, node) => {
    const next = window.prompt('ノードを編集', String(node.data.label ?? ''))
    if (next?.trim()) onNodeEdit(node.id, { label: next.trim() })
  }

  return (
    <div className="pyramid-flow-canvas">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        zoomOnScroll
        panOnDrag
        nodesDraggable
        nodesConnectable={false}
        onNodeDoubleClick={handleNodeDoubleClick}
      >
        <Controls showZoom={false} showInteractive={false} position="bottom-left" />
        <Background gap={18} />
      </ReactFlow>
    </div>
  )
}
