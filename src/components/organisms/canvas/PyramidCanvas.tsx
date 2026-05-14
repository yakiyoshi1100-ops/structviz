import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type ReactFlowProps,
} from '@xyflow/react'

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
    type: 'step',
  }))
  const visibleParentIds = new Set([
    root.id,
    ...grouped.arguments.map((node) => node.id),
  ])

  const evidenceEdges = grouped.evidence.map((node, index) => {
    const fallbackParent = grouped.arguments[index % Math.max(grouped.arguments.length, 1)] ?? root
    const source = node.parentId && visibleParentIds.has(node.parentId) ? node.parentId : fallbackParent.id

    return {
      id: `${source}-${node.id}`,
      source,
      target: node.id,
      type: 'step',
    }
  })

  return [...argumentEdges, ...evidenceEdges]
}

function getDescendantIds(nodeId: string, edges: Edge[]): Set<string> {
  const result = new Set<string>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const current = queue.shift()!

    edges
      .filter((edge) => edge.source === current)
      .forEach((edge) => {
        if (!result.has(edge.target)) {
          result.add(edge.target)
          queue.push(edge.target)
        }
      })
  }

  return result
}

function createNode(
  node: StructuredNode,
  layer: PyramidLayer,
  collapsedIds: Set<string>,
  hasChildren: boolean,
): Node {
  const marker = hasChildren ? `${collapsedIds.has(node.id) ? '▶' : '▼'} ` : ''

  return {
    id: node.id,
    position: { x: 0, y: 0 },
    draggable: true,
    data: { label: `${marker}${node.label}`, rawLabel: node.label, level: layer },
    className: `pyramid-flow-node pyramid-flow-node--${layer}`,
    style: {
      width: NODE_SIZE[layer].width,
    },
  }
}

function applyPyramidLayout(nodes: Node[], _edges: Edge[]): Node[] {
  const LAYER_Y: Record<Exclude<PyramidLayer, 'evidence'>, number> = { conclusion: 0, argument: 220 }
  const EVIDENCE_START_Y = 440
  const H_GAP = 40
  const V_GAP = 30
  const EVIDENCE_PER_ROW = 4
  const layers: Record<PyramidLayer, Node[]> = {
    conclusion: [],
    argument: [],
    evidence: [],
  }

  nodes.forEach((node) => {
    layers[nodeLayer(node)].push(node)
  })

  const positioned: Node[] = []

  ;(['conclusion', 'argument'] as Exclude<PyramidLayer, 'evidence'>[]).forEach((layer) => {
    const layerNodes = layers[layer]
    const size = NODE_SIZE[layer]
    const totalWidth = layerNodes.length * size.width + H_GAP * Math.max(layerNodes.length - 1, 0)
    let cursorX = -totalWidth / 2

    layerNodes.forEach((node) => {
      positioned.push({
        ...node,
        position: {
          x: cursorX,
          y: LAYER_Y[layer],
        },
      })

      cursorX += size.width + H_GAP
    })
  })

  const evidenceNodes = layers.evidence
  const size = NODE_SIZE.evidence

  for (let rowStart = 0; rowStart < evidenceNodes.length; rowStart += EVIDENCE_PER_ROW) {
    const rowNodes = evidenceNodes.slice(rowStart, rowStart + EVIDENCE_PER_ROW)
    const rowIndex = rowStart / EVIDENCE_PER_ROW
    const totalWidth = rowNodes.length * size.width + H_GAP * Math.max(rowNodes.length - 1, 0)
    let cursorX = -totalWidth / 2
    const rowY = EVIDENCE_START_Y + rowIndex * (size.height + V_GAP)

    rowNodes.forEach((node) => {
      positioned.push({
        ...node,
        position: {
          x: cursorX,
          y: rowY,
        },
      })

      cursorX += size.width + H_GAP
    })
  }

  return positioned
}

export function PyramidCanvas({ graph, onNodeEdit }: PyramidCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const grouped = useMemo(() => groupNodes(graph.nodes), [graph.nodes])
  const flowEdges = useMemo(() => createEdges(grouped), [grouped])
  const rawNodes = useMemo(() => {
    const rawNodes = [
      ...grouped.conclusion.map((node) =>
        createNode(node, 'conclusion', collapsedIds, flowEdges.some((edge) => edge.source === node.id)),
      ),
      ...grouped.arguments.map((node) =>
        createNode(node, 'argument', collapsedIds, flowEdges.some((edge) => edge.source === node.id)),
      ),
      ...grouped.evidence.map((node) =>
        createNode(node, 'evidence', collapsedIds, flowEdges.some((edge) => edge.source === node.id)),
      ),
    ]

    console.log('[dagre input] nodes:', rawNodes.map((node) => ({ id: node.id, level: (node.data as { level?: string }).level })))
    console.log('[dagre input] edges:', flowEdges.map((edge) => ({ source: edge.source, target: edge.target })))

    return rawNodes
  }, [collapsedIds, flowEdges, grouped])

  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>()

    collapsedIds.forEach((id) => {
      getDescendantIds(id, flowEdges).forEach((descendantId) => hidden.add(descendantId))
    })

    return hidden
  }, [collapsedIds, flowEdges])

  const visibleEdges = useMemo(
    () => flowEdges.filter((edge) => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target)),
    [flowEdges, hiddenIds],
  )

  const visibleNodes = useMemo(
    () => applyPyramidLayout(rawNodes.filter((node) => !hiddenIds.has(node.id)), visibleEdges),
    [hiddenIds, rawNodes, visibleEdges],
  )

  useEffect(() => {
    console.log('[PyramidCanvas data]', {
      rawGraph: graph,
      grouped,
      nodes: visibleNodes,
      edges: visibleEdges,
    })
  }, [graph, grouped, visibleEdges, visibleNodes])

  useEffect(() => {
    if (visibleNodes.length === 0) return

    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.1, duration: 400 })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [visibleNodes])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.1, duration: 300 })
    }, 200)

    return () => window.clearTimeout(timer)
  }, [collapsedIds])

  const handleNodeClick: NonNullable<ReactFlowProps['onNodeClick']> = (_event, node) => {
    const hasChildren = flowEdges.some((edge) => edge.source === node.id)

    if (!hasChildren) return

    setCollapsedIds((prev) => {
      const next = new Set(prev)

      if (next.has(node.id)) {
        next.delete(node.id)
      } else {
        next.add(node.id)
      }

      return next
    })
  }

  const handleNodeDoubleClick: NonNullable<ReactFlowProps['onNodeDoubleClick']> = (_event, node) => {
    const label = (node.data as { rawLabel?: string; label?: string }).rawLabel ?? node.data.label
    const next = window.prompt('ノードを編集', String(label ?? ''))
    if (next?.trim()) onNodeEdit(node.id, { label: next.trim() })
  }

  return (
    <div className="pyramid-flow-canvas">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
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
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
      >
        <Controls showZoom={false} showInteractive={false} position="bottom-right" />
        <Background gap={18} />
      </ReactFlow>
    </div>
  )
}
