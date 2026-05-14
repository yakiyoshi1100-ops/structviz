import { useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowProps,
} from '@xyflow/react'

import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { applyTreeLayout } from './layouts/treeLayout'
import { TreeNode, type TreeNodeData } from './nodes/TreeNode'

interface TreeCanvasProps {
  graph: FrameworkGraph
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onDropUnclassified: (nodeId: string, role: NodeRole) => void
  readonly?: boolean
}

const nodeTypes = {
  treeNode: TreeNode,
}

export function TreeCanvas({
  graph,
  onNodeMove,
  onNodeEdit,
  onDropUnclassified,
  readonly = false,
}: TreeCanvasProps) {
  const laidOutNodes = useMemo(() => {
    const rankdir = graph.frameworkType === FrameworkType.PYRAMID ? 'BT' : 'LR'
    return applyTreeLayout(graph.nodes, graph.edges, rankdir)
  }, [graph])

  const flowNodes = useMemo<Node<TreeNodeData>[]>(
    () =>
      laidOutNodes.map((node) => ({
        id: node.id,
        type: 'treeNode',
        position: node.position,
        draggable: !readonly,
        data: {
          node,
          onEdit: (nodeId, label) => onNodeEdit(nodeId, { label }),
        },
      })),
    [laidOutNodes, onNodeEdit, readonly],
  )

  const flowEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
      })),
    [graph.edges],
  )

  const handleNodeDragStop: NonNullable<ReactFlowProps['onNodeDragStop']> = (_event, node) => {
    onNodeMove(node.id, node.position)
  }

  return (
    <div
      className="tree-canvas"
      style={{ width: '100%', height: '100%' }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const nodeId = event.dataTransfer.getData('text/plain')

        if (nodeId) {
          onDropUnclassified(nodeId, 'leaf')
        }
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        zoomOnScroll
        nodesDraggable={!readonly}
        nodesConnectable={false}
        onNodeDragStop={handleNodeDragStop}
      >
        <Controls />
        <Background gap={18} />
      </ReactFlow>
    </div>
  )
}
