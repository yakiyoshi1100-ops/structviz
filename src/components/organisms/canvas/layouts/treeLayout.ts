import dagre from '@dagrejs/dagre'

import type { StructuredEdge, StructuredNode } from '@/types'

const NODE_WIDTH = 200
const NODE_HEIGHT = 86

export function applyTreeLayout(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
  rankdir: 'TB' | 'BT' | 'LR' = 'TB',
): StructuredNode[] {
  const graph = new dagre.graphlib.Graph()

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir,
    nodesep: 80,
    ranksep: 100,
  })

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })
  })

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target)
  })

  dagre.layout(graph)

  return nodes.map((node) => {
    const positioned = graph.node(node.id)

    if (!positioned) {
      return node
    }

    return {
      ...node,
      position: {
        x: positioned.x - NODE_WIDTH / 2,
        y: positioned.y - NODE_HEIGHT / 2,
      },
    }
  })
}
