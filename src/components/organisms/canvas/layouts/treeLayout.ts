import type { StructuredEdge, StructuredNode } from '@/types'

const NODE_WIDTH  = 220
const NODE_HEIGHT = 90
const H_GAP       = 120
const V_GAP       = 40

/**
 * Tree layout that centres every parent node over its children vertically.
 *
 * Approach (simplified Reingold–Tilford):
 *  1. Traverse the tree depth-first.
 *  2. Leaf nodes (no children in the tree) are assigned sequential y-slots
 *     top-to-bottom.
 *  3. Each internal node is placed at the vertical midpoint between its
 *     first and last child's y-centre, eliminating edge crossings caused
 *     by uniform-spacing layouts.
 *  4. The whole diagram is shifted to be vertically centred at y = 0.
 */
export function applyTreeLayout(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
  rankdir: 'TB' | 'BT' | 'LR' = 'LR',
): StructuredNode[] {
  if (nodes.length === 0) return nodes

  const nodeIds = new Set(nodes.map(n => n.id))

  // ── build adjacency ─────────────────────────────────────────────────────
  const childrenOf = new Map<string, string[]>()
  const hasParent  = new Set<string>()
  nodes.forEach(n => childrenOf.set(n.id, []))
  edges.forEach(e => {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      childrenOf.get(e.source)!.push(e.target)
      hasParent.add(e.target)
    }
  })

  // ── roots = nodes with no incoming edge ─────────────────────────────────
  const rootNodes = nodes.filter(n => !hasParent.has(n.id))
  const rootIds   = rootNodes.length > 0
    ? rootNodes.map(r => r.id)
    : [nodes[0].id]

  // ── recursive layout ─────────────────────────────────────────────────────
  const positionMap = new Map<string, { x: number; y: number }>()
  const leafSlot    = { n: 0 }   // shared mutable counter for leaf slots

  function layoutNode(id: string, depth: number): number {
    const children = childrenOf.get(id) ?? []
    const x = depth * (NODE_WIDTH + H_GAP)

    if (children.length === 0) {
      // Leaf: claim the next sequential slot
      const y = leafSlot.n * (NODE_HEIGHT + V_GAP)
      leafSlot.n++
      positionMap.set(id, { x, y })
      return y
    }

    // Internal node: lay out all children first, then centre this node
    // at the midpoint between the first child's top and the last child's bottom.
    const childCenters = children.map(c => layoutNode(c, depth + 1))
    const y = (Math.min(...childCenters) + Math.max(...childCenters)) / 2
    positionMap.set(id, { x, y })
    return y
  }

  rootIds.forEach(r => layoutNode(r, 0))

  // Any orphaned nodes (not reachable from any root) are stacked below
  nodes.forEach(n => {
    if (!positionMap.has(n.id)) {
      const y = leafSlot.n * (NODE_HEIGHT + V_GAP)
      leafSlot.n++
      positionMap.set(n.id, { x: 0, y })
    }
  })

  // ── centre the whole diagram at y = 0 ───────────────────────────────────
  const ys          = Array.from(positionMap.values()).map(p => p.y)
  const centerShift = (Math.min(...ys) + Math.max(...ys)) / 2

  return nodes.map(n => {
    const { x, y } = positionMap.get(n.id)!
    const cy = y - centerShift    // vertically centred y

    if (rankdir === 'BT') return { ...n, position: { x,  y: -cy } }
    if (rankdir === 'TB') return { ...n, position: { x: cy, y: x  } }
    return                        { ...n, position: { x,  y: cy  } }
  })
}
