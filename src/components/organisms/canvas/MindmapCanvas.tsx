import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Background,
  ControlButton,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  type ReactFlowProps,
} from '@xyflow/react'
import type { FrameworkGraph, StructuredEdge, StructuredNode } from '@/types'

type MindmapSide = 'left' | 'right' | 'center'
type MindmapDepth = 'root' | 'branch' | 'leaf'

interface MindmapNodeData extends Record<string, unknown> {
  label: string
  rawLabel: string
  side: MindmapSide
  depth: number
  visualDepth: MindmapDepth
}

interface MindmapCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

const NODE_SIZE: Record<MindmapDepth, { width: number; height: number }> = {
  root: { width: 240, height: 96 },
  branch: { width: 200, height: 86 },
  leaf: { width: 180, height: 78 },
}
const H_GAP = 260
const V_GAP = 80

const baseEdgeStyle: CSSProperties = { stroke: '#94a3b8', strokeWidth: 1.6 }
const selectedEdgeStyle: CSSProperties = { stroke: '#ef4444', strokeWidth: 3 }
const edgeColorByDepth: Record<string, string> = {
  '0': '#3b82f6',
  '1': '#60a5fa',
  '2': '#93c5fd',
}

function visualDepth(depth: number): MindmapDepth {
  if (depth === 0) return 'root'
  if (depth === 1) return 'branch'
  return 'leaf'
}

function getNodeLabel(node: StructuredNode): string {
  return node.label || node.description || node.id
}

function getRootNode(nodes: StructuredNode[], edges: StructuredEdge[]): StructuredNode | undefined {
  const targetIds = new Set(edges.map((edge) => edge.target))
  return nodes.find((node) => node.role === 'root' && !targetIds.has(node.id)) ?? nodes.find((node) => !targetIds.has(node.id)) ?? nodes[0]
}

function buildBaseEdges(nodes: StructuredNode[], graphEdges: StructuredEdge[], rootId: string): Edge[] {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const validEdges = graphEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      style: baseEdgeStyle,
    }))

  if (validEdges.length > 0) return validEdges

  return nodes
    .filter((node) => node.id !== rootId)
    .map((node) => ({
      id: `mindmap-${rootId}-${node.id}`,
      source: rootId,
      target: node.id,
      type: 'default',
      style: baseEdgeStyle,
    }))
}

function getDescendantIds(nodeId: string, edges: Edge[]): Set<string> {
  const result = new Set<string>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

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

function centerToTopLeft(x: number, y: number, depth: number): { x: number; y: number } {
  const size = NODE_SIZE[visualDepth(depth)]
  return {
    x: x - size.width / 2,
    y: y - size.height / 2,
  }
}

function getChildrenMap(edges: Edge[]): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)?.push(edge.target)
  })
  return childrenMap
}

function applyMindmapLayout(
  nodes: StructuredNode[],
  edges: Edge[],
  rootId: string,
  collapsedIds: Set<string>,
): Node<MindmapNodeData>[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const childrenMap = getChildrenMap(edges)
  const result: Node<MindmapNodeData>[] = []
  const visited = new Set<string>()

  const subtreeHeightCache = new Map<string, number>()
  function getSubtreeHeight(nodeId: string): number {
    if (subtreeHeightCache.has(nodeId)) return subtreeHeightCache.get(nodeId)!
    const children = childrenMap.get(nodeId) ?? []
    if (children.length === 0 || collapsedIds.has(nodeId)) {
      subtreeHeightCache.set(nodeId, V_GAP)
      return V_GAP
    }

    const total = children.reduce((sum, childId) => sum + getSubtreeHeight(childId), 0)
    subtreeHeightCache.set(nodeId, total)
    return total
  }

  function createFlowNode(node: StructuredNode, depth: number, side: MindmapSide, x: number, y: number): Node<MindmapNodeData> {
    const hasChildren = (childrenMap.get(node.id) ?? []).length > 0
    const marker = hasChildren ? `${collapsedIds.has(node.id) ? '▶' : '▼'} ` : ''
    const label = getNodeLabel(node)
    const nodeDepth = visualDepth(depth)

    return {
      id: node.id,
      type: 'mindmapNode',
      position: centerToTopLeft(x, y, depth),
      data: {
        label: `${marker}${label}`,
        rawLabel: label,
        side,
        depth,
        visualDepth: nodeDepth,
      },
      className: `mindmap-flow-node mindmap-flow-node--${nodeDepth} mindmap-flow-node--${side}`,
      draggable: true,
      selectable: true,
    }
  }

  function placeChildren(
    parentId: string,
    parentX: number,
    parentY: number,
    depth: number,
    side: Exclude<MindmapSide, 'center'>,
  ): void {
    const children = (childrenMap.get(parentId) ?? []).map((id) => nodeById.get(id)).filter((node): node is StructuredNode => Boolean(node))
    if (children.length === 0) return

    const direction = side === 'left' ? -1 : 1
    const totalHeight = children.reduce((sum, child) => sum + getSubtreeHeight(child.id), 0)
    let cursorY = parentY - totalHeight / 2

    children.forEach((child) => {
      const childSubtreeHeight = getSubtreeHeight(child.id)
      const childY = cursorY + childSubtreeHeight / 2
      const childX = parentX + direction * H_GAP

      if (!visited.has(child.id)) {
        visited.add(child.id)
        result.push(createFlowNode(child, depth, side, childX, childY))
        placeChildren(child.id, childX, childY, depth + 1, side)
      }

      cursorY += childSubtreeHeight
    })
  }

  const root = nodeById.get(rootId) ?? nodes[0]
  if (!root) return []

  visited.add(root.id)
  result.push(createFlowNode(root, 0, 'center', 0, 0))

  const rootChildren = (childrenMap.get(root.id) ?? []).map((id) => nodeById.get(id)).filter((node): node is StructuredNode => Boolean(node))
  const rightChildren = rootChildren.filter((_, index) => index % 2 === 0)
  const leftChildren = rootChildren.filter((_, index) => index % 2 === 1)

  function placeRootSide(children: StructuredNode[], side: Exclude<MindmapSide, 'center'>): void {
    if (children.length === 0) return
    const direction = side === 'left' ? -1 : 1
    const totalHeight = children.reduce((sum, child) => sum + getSubtreeHeight(child.id), 0)
    let cursorY = -totalHeight / 2

    children.forEach((child) => {
      const childSubtreeHeight = getSubtreeHeight(child.id)
      const childY = cursorY + childSubtreeHeight / 2
      const childX = direction * H_GAP

      if (!visited.has(child.id)) {
        visited.add(child.id)
        result.push(createFlowNode(child, 1, side, childX, childY))
        placeChildren(child.id, childX, childY, 2, side)
      }

      cursorY += childSubtreeHeight
    })
  }

  placeRootSide(rightChildren, 'right')
  placeRootSide(leftChildren, 'left')

  nodes.forEach((node, index) => {
    if (visited.has(node.id)) return
    const side: Exclude<MindmapSide, 'center'> = index % 2 === 0 ? 'right' : 'left'
    const direction = side === 'left' ? -1 : 1
    const y = (index + 1) * V_GAP
    visited.add(node.id)
    result.push(createFlowNode(node, 1, side, direction * H_GAP, y))
  })

  return result
}

function sourceHandleFor(sourceSide: MindmapSide, targetSide: MindmapSide): string {
  if (sourceSide === 'center') return targetSide === 'left' ? 'source-left' : 'source-right'
  return sourceSide === 'left' ? 'source-left' : 'source-right'
}

function targetHandleFor(targetSide: MindmapSide): string {
  return targetSide === 'left' ? 'target-right' : 'target-left'
}

function MindmapNode({ data, selected }: NodeProps<Node<MindmapNodeData>>) {
  const nodeData = data as MindmapNodeData
  const title = nodeData.rawLabel

  if (nodeData.side === 'center') {
    return (
      <div className={`mindmap-node mindmap-node--${nodeData.visualDepth}`} data-selected={selected ? 'true' : 'false'} title={title}>
        <Handle id="target-left" type="target" position={Position.Left} style={{ opacity: 0 }} />
        <Handle id="source-left" type="source" position={Position.Left} style={{ opacity: 0 }} />
        <Handle id="source-right" type="source" position={Position.Right} style={{ opacity: 0 }} />
        <span>{nodeData.label}</span>
      </div>
    )
  }

  const targetPosition = nodeData.side === 'left' ? Position.Right : Position.Left
  const sourcePosition = nodeData.side === 'left' ? Position.Left : Position.Right
  const targetId = nodeData.side === 'left' ? 'target-right' : 'target-left'
  const sourceId = nodeData.side === 'left' ? 'source-left' : 'source-right'

  return (
    <div className={`mindmap-node mindmap-node--${nodeData.visualDepth}`} data-selected={selected ? 'true' : 'false'} title={title}>
      <Handle id={targetId} type="target" position={targetPosition} style={{ opacity: 0 }} />
      <Handle id={sourceId} type="source" position={sourcePosition} style={{ opacity: 0 }} />
      <span>{nodeData.label}</span>
    </div>
  )
}

const nodeTypes = { mindmapNode: MindmapNode }

export function MindmapCanvas({ graph, onNodeEdit }: MindmapCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance<Node<MindmapNodeData>, Edge> | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const rootNode = useMemo(() => getRootNode(graph.nodes, graph.edges), [graph.nodes, graph.edges])
  const rootId = rootNode?.id ?? graph.nodes[0]?.id ?? ''

  const baseEdges = useMemo(() => buildBaseEdges(graph.nodes, graph.edges, rootId), [graph.nodes, graph.edges, rootId])

  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>()
    collapsedIds.forEach((id) => {
      getDescendantIds(id, baseEdges).forEach((descendantId) => hidden.add(descendantId))
    })
    return hidden
  }, [baseEdges, collapsedIds])

  const visibleStructuredNodes = useMemo(
    () => graph.nodes.filter((node) => !hiddenIds.has(node.id)),
    [graph.nodes, hiddenIds],
  )

  const visibleBaseEdges = useMemo(
    () => baseEdges.filter((edge) => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target)),
    [baseEdges, hiddenIds],
  )

  const flowNodes = useMemo(
    () => applyMindmapLayout(visibleStructuredNodes, visibleBaseEdges, rootId, collapsedIds),
    [visibleStructuredNodes, visibleBaseEdges, rootId, collapsedIds],
  )

  const flowEdges = useMemo(() => {
    const nodeDataById = new Map(flowNodes.map((node) => [node.id, node.data]))

    return visibleBaseEdges.map((edge) => {
      const sourceSide = nodeDataById.get(edge.source)?.side ?? 'right'
      const targetSide = nodeDataById.get(edge.target)?.side ?? 'right'
      const sourceDepth = nodeDataById.get(edge.source)?.depth ?? 0
      const depthKey = String(Math.min(sourceDepth, 2))
      const dynamicStyle: CSSProperties = {
        stroke: edgeColorByDepth[depthKey] ?? '#94a3b8',
        strokeWidth: sourceDepth === 0 ? 2.5 : 2,
      }

      return {
        ...edge,
        type: 'default',
        sourceHandle: sourceHandleFor(sourceSide, targetSide),
        targetHandle: targetHandleFor(targetSide),
        style: edge.id === selectedEdgeId ? selectedEdgeStyle : dynamicStyle,
      }
    })
  }, [flowNodes, selectedEdgeId, visibleBaseEdges])

  useEffect(() => {
    if (flowNodes.length === 0) return
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.18, duration: 400 })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [flowNodes])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.18, duration: 300 })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [collapsedIds])

  const handleNodeClick: NonNullable<ReactFlowProps['onNodeClick']> = (_event, node) => {
    const hasChildren = baseEdges.some((edge) => edge.source === node.id)
    if (!hasChildren) return

    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  const handleNodeDoubleClick: NonNullable<ReactFlowProps['onNodeDoubleClick']> = (_event, node) => {
    const current = (node.data as MindmapNodeData).rawLabel
    const label = window.prompt('ノードのテキストを編集', current)
    if (label === null || label.trim() === '') return
    onNodeEdit(node.id, { label: label.trim() })
  }

  return (
    <div className="mindmap-flow-canvas">
      <ReactFlow<Node<MindmapNodeData>, Edge>
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        zoomOnScroll
        panOnDrag
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={(_event, edge) => setSelectedEdgeId(edge.id)}
        onPaneClick={() => setSelectedEdgeId(null)}
        onInit={(instance) => {
          flowInstanceRef.current = instance
          window.setTimeout(() => instance.fitView({ padding: 0.18, duration: 400 }), 250)
        }}
      >
        <Background gap={18} size={1} />
        <Controls showInteractive={false} showZoom={false} position="bottom-right">
          <ControlButton onClick={() => flowInstanceRef.current?.fitView({ padding: 0.18, duration: 300 })} title="全体表示">
            □
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}
