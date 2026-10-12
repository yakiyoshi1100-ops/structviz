import { useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type ReactFlowProps,
} from '@xyflow/react'

import { type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { applySpanningLayout } from './layouts/spanningTreeLayout'
import { TreeNode, ROOT_ROLES, type TreeNodeData } from './nodes/TreeNode'

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT RULES — LR Spanning Tree
// (WHY_TREE / WHAT_TREE / HOW_TREE / ISSUE_TREE 共通)
// ──────────────────────────────────────────────────────────────────────────────
// 1. 方向         : 左（根）→ 右（末端）
// 2. ノード高さ   : parent.height = Σ child.height + gap × (n−1)
//                  → 親ノードが子群を縦にスパンし、エッジが水平に出て交差しない
// 3. ノードスタイル: ROOT=濃色、BRANCH=中間色、LEAF=薄色 ／ ロールヒント文字なし
// 4. エッジ色     : Root 直接子ごとにブランチカラーを割り当て → 子孫に継承
//                  （MindWeaver 方式：同一ブランチは同色）
// 5. エッジ重複なし: 子エッジは親ノードの対応 Y 位置から出るため交差ゼロ
// ══════════════════════════════════════════════════════════════════════════════

// ── ブランチカラーパレット（MindWeaver 準拠） ────────────────────────────────
const BRANCH_PALETTE = [
  '#ef4444',  // red
  '#f97316',  // orange
  '#eab308',  // yellow
  '#22c55e',  // green
  '#06b6d4',  // cyan
  '#6366f1',  // indigo
  '#ec4899',  // pink
  '#8b5cf6',  // violet
  '#14b8a6',  // teal
  '#f43f5e',  // rose
]

interface TreeCanvasProps {
  graph:              FrameworkGraph
  onNodeMove:         (nodeId: string, position: StructuredNode['position']) => void
  onNodeEdit:         (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onDropUnclassified: (nodeId: string, role: NodeRole) => void
  readonly?:          boolean
}

const nodeTypes = { treeNode: TreeNode }

// ── グラフ変化時に自動 fitView するサブコンポーネント ────────────────────────
function AutoFitView({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const timer = setTimeout(() => void fitView({ padding: 0.18, duration: 400 }), 60)
    return () => clearTimeout(timer)
  }, [nodeCount, fitView])
  return null
}

export function TreeCanvas({
  graph,
  onNodeMove,
  onNodeEdit,
  onDropUnclassified,
  readonly = false,
}: TreeCanvasProps) {
  const graphVersion = useMemo(() => Date.now(), [graph])

  // ── Spanning Tree レイアウト ───────────────────────────────────────────────
  const laidOut = useMemo(
    () => applySpanningLayout(graph.nodes, graph.edges),
    [graph],
  )

  // ── ブランチカラーマップ（MindWeaver 方式） ────────────────────────────────
  const branchColorMap = useMemo(() => {
    const hasParent   = new Set(graph.edges.map(e => e.target))
    const roots       = graph.nodes.filter(n => !hasParent.has(n.id))
    const root        = roots[0]
    const colorMap    = new Map<string, string>()
    if (!root) return colorMap

    colorMap.set(root.id, '#1a3560')

    const rootChildren = graph.edges
      .filter(e => e.source === root.id)
      .map(e => e.target)

    rootChildren.forEach((childId, i) => {
      colorMap.set(childId, BRANCH_PALETTE[i % BRANCH_PALETTE.length])
    })

    // BFS で子孫に色を伝播
    const queue = [...rootChildren]
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const color  = colorMap.get(nodeId) ?? '#94a3b8'
      graph.edges
        .filter(e => e.source === nodeId)
        .forEach(e => {
          if (!colorMap.has(e.target)) {
            colorMap.set(e.target, color)
            queue.push(e.target)
          }
        })
    }
    return colorMap
  }, [graph.nodes, graph.edges])

  // ── 子エッジの順序マップ（sourceHandle インデックス解決用） ───────────────
  // applySpanningLayout と同じ順序（重複除外済み）で子 ID を保持する
  const childrenOrderOf = useMemo(() => {
    const m = new Map<string, string[]>()
    graph.edges.forEach(e => {
      if (!m.has(e.source)) m.set(e.source, [])
      const list = m.get(e.source)!
      if (!list.includes(e.target)) list.push(e.target)
    })
    return m
  }, [graph.edges])

  // ── ReactFlow ノード ───────────────────────────────────────────────────────
  const flowNodes = useMemo<Node<TreeNodeData>[]>(
    () =>
      laidOut.map(ln => ({
        id:        ln.id,
        type:      'treeNode',
        position:  { x: ln.x, y: ln.y },
        width:     ln.width,
        height:    ln.height,
        draggable: !readonly,
        style:     { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
        data: {
          node:                graph.nodes.find(n => n.id === ln.id)!,
          sourceHandlePercents: ln.sourceHandlePercents,
          onEdit:              (nodeId: string, label: string) =>
                                 onNodeEdit(nodeId, { label }),
        },
      })),
    [laidOut, graph.nodes, onNodeEdit, readonly],
  )

  // ── ReactFlow エッジ ───────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map(edge => {
        const siblings = childrenOrderOf.get(edge.source) ?? []
        const childIdx = siblings.indexOf(edge.target)

        const color       = branchColorMap.get(edge.target)
                         ?? branchColorMap.get(edge.source)
                         ?? '#94a3b8'
        const srcRole     = graph.nodes.find(n => n.id === edge.source)?.role
        const strokeWidth = srcRole && ROOT_ROLES.has(srcRole) ? 2.5 : 2

        return {
          id:           edge.id,
          source:       edge.source,
          target:       edge.target,
          sourceHandle: `src-${childIdx}`,
          targetHandle: 'target',
          label:        edge.label,
          type:         'smoothstep',
          style:        { stroke: color, strokeWidth },
        }
      }),
    [graph.edges, graph.nodes, childrenOrderOf, branchColorMap],
  )

  const handleNodeDragStop: NonNullable<ReactFlowProps['onNodeDragStop']> = (_event, node) => {
    onNodeMove(node.id, node.position)
  }

  return (
    <div
      className="tree-canvas"
      style={{ width: '100%', height: '100%' }}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        const nodeId = event.dataTransfer.getData('text/plain')
        if (nodeId) onDropUnclassified(nodeId, 'leaf')
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        zoomOnScroll
        nodesDraggable={!readonly}
        nodesConnectable={false}
        onNodeDragStop={handleNodeDragStop}
      >
        <AutoFitView nodeCount={graphVersion} />
        <Controls />
        <Background gap={18} />
      </ReactFlow>
    </div>
  )
}
