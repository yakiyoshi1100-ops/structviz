import type { StructuredEdge, StructuredNode } from '@/types'

const NODE_WIDTH = 220
const NODE_HEIGHT = 90
const H_GAP = 120
const V_GAP = 40

export function applyTreeLayout(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
  rankdir: 'TB' | 'BT' | 'LR' = 'LR',
): StructuredNode[] {
  if (nodes.length === 0) return nodes

  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)!.push(edge.target)
    hasParent.add(edge.target)
  })

  const roots = nodes.filter((node) => !hasParent.has(node.id))
  const rootIds = roots.length > 0 ? roots.map((root) => root.id) : [nodes[0].id]
  const depthMap = new Map<string, number>()
  const queue: { id: string; depth: number }[] = rootIds.map((id) => ({ id, depth: 0 }))

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!

    if (depthMap.has(id)) continue

    depthMap.set(id, depth)

    const children = childrenMap.get(id) ?? []
    children.forEach((childId) => {
      if (!depthMap.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 })
      }
    })
  }

  nodes.forEach((node) => {
    if (!depthMap.has(node.id)) depthMap.set(node.id, 0)
  })

  const byDepth = new Map<number, StructuredNode[]>()

  nodes.forEach((node) => {
    const depth = depthMap.get(node.id) ?? 0
    if (!byDepth.has(depth)) byDepth.set(depth, [])
    byDepth.get(depth)!.push(node)
  })

  const positionMap = new Map<string, { x: number; y: number }>()
  const sortedDepths = Array.from(byDepth.keys()).sort((a, b) => a - b)

  sortedDepths.forEach((depth) => {
    const layerNodes = byDepth.get(depth)!
    const totalHeight = layerNodes.length * NODE_HEIGHT + V_GAP * Math.max(layerNodes.length - 1, 0)
    let cursorY = -totalHeight / 2

    layerNodes.forEach((node) => {
      const x = depth * (NODE_WIDTH + H_GAP)
      const y = cursorY
      positionMap.set(node.id, { x, y })
      cursorY += NODE_HEIGHT + V_GAP
    })
  })

  return nodes.map((node) => {
    const pos = positionMap.get(node.id) ?? { x: 0, y: 0 }
    let finalPos = pos

    if (rankdir === 'BT') {
      finalPos = { x: pos.x, y: -pos.y }
    } else if (rankdir === 'TB') {
      finalPos = { x: pos.y, y: pos.x }
    }

    return {
      ...node,
      position: finalPos,
    }
  })
}
