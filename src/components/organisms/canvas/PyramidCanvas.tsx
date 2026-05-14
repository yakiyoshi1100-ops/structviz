import { useEffect, useMemo, useRef } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type ReactFlowProps,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'

import type { FrameworkGraph, StructuredNode } from '@/types'

interface PyramidCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

type PyramidLayer = 'conclusion' | 'argument' | 'evidence'

const ROLE_ORDER = ['conclusion', 'argument', 'evidence', 'root', 'branch', 'leaf']
const NODE_SIZE: Record<PyramidLayer, { width: number; height: number }> = {
  conclusion: { width: 320, height: 100 },
  argument: { width: 240, height: 90 },
  evidence: { width: 220, height: 90 },
}

function nodeLayer(node: Node): PyramidLayer {
  const level = (node.data as { level?: string }).level

  if (level === 'conclusion') return 'conclusion'
  if (level === 'argument') return 'argument'
  return 'evidence'
}

function groupNodes(nodes: StructuredNode[]) {
  const conclusionCandidates = nodes.filter((node) => ['conclusion', 'root'].includes(node.role))
  const conclusion = conclusionCandidates.length > 0 ? conclusionCandidates.slice(0, 1) : nodes.slice(0, 1)
  const conclusionIds = new Set(conclusion.map((node) => node.id))
  const arguments_ = nodes.filter(
    (node) => ['argument', 'branch'].includes(node.role) && !conclusionIds.has(node.id),
  )
  const evidence = nodes.filter(
    (node) => ['evidence', 'leaf'].includes(node.role) && !conclusionIds.has(node.id),
  )
  const used = new Set([...conclusion, ...arguments_, ...evidence].map((node) => node.id))
  const rest = nodes
    .filter((node) => !used.has(node.id))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))

  return {
    conclusion,
    arguments: arguments_.length > 0 ? arguments_ : rest.slice(0, 4),
    evidence: evidence.length > 0 ? evidence : rest.slice(arguments_.length > 0 ? 0 : 4),
  }
}

function createEdges(grouped: ReturnType<typeof groupNodes>): Edge[] {
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
}

function createNode(node: StructuredNode, layer: PyramidLayer): Node {
  return {
    id: node.id,
    position: { x: 0, y: 0 },
    draggable: true,
    data: { label: node.label, level: layer },
    className: `pyramid-flow-node pyramid-flow-node--${layer}`,
    style: {
      width: NODE_SIZE[layer].width,
    },
  }
}

function applyPyramidLayout(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph()

  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, NODE_SIZE[nodeLayer(node)])
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  console.log('[dagre output]', nodes.map((node) => {
    const positioned = dagreGraph.node(node.id)
    return {
      id: node.id,
      level: (node.data as any).level,
      sizeUsed: NODE_SIZE[nodeLayer(node)],
      dagrePos: positioned ? { x: positioned.x, y: positioned.y } : 'UNDEFINED',
    }
  }))

  return nodes.map((node) => {
    const positioned = dagreGraph.node(node.id)
    const size = NODE_SIZE[nodeLayer(node)]

    return {
      ...node,
      position: positioned
        ? {
            x: positioned.x - size.width / 2,
            y: positioned.y - size.height / 2,
          }
        : node.position,
    }
  })
}

export function PyramidCanvas({ graph, onNodeEdit }: PyramidCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const grouped = useMemo(() => groupNodes(graph.nodes), [graph.nodes])
  const flowEdges = useMemo(() => createEdges(grouped), [grouped])
  const flowNodes = useMemo(() => {
    const rawNodes = [
      ...grouped.conclusion.map((node) => createNode(node, 'conclusion')),
      ...grouped.arguments.map((node) => createNode(node, 'argument')),
      ...grouped.evidence.map((node) => createNode(node, 'evidence')),
    ]

    console.log('[dagre input] nodes:', rawNodes.map((node) => ({ id: node.id, level: (node.data as { level?: string }).level })))
    console.log('[dagre input] edges:', flowEdges.map((edge) => ({ source: edge.source, target: edge.target })))

    return applyPyramidLayout(rawNodes, flowEdges)
  }, [grouped, flowEdges])

  useEffect(() => {
    console.log('[PyramidCanvas data]', {
      rawGraph: graph,
      grouped,
      nodes: flowNodes,
      edges: flowEdges,
    })
  }, [flowEdges, flowNodes, graph, grouped])

  useEffect(() => {
    if (flowNodes.length === 0) return

    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.15, duration: 400 })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [flowNodes])

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
        fitViewOptions={{ padding: 0.15 }}
        zoomOnScroll
        panOnDrag
        nodesDraggable
        nodesConnectable={false}
        onInit={(instance) => {
          flowInstanceRef.current = instance
          window.setTimeout(() => instance.fitView({ padding: 0.15, duration: 400 }), 200)
        }}
        onNodeDoubleClick={handleNodeDoubleClick}
      >
        <Controls showZoom={false} showInteractive={false} position="bottom-right" />
        <Background gap={18} />
      </ReactFlow>
    </div>
  )
}
