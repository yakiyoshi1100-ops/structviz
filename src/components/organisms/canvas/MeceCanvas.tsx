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

import type { FrameworkGraph, NodeRole, StructuredEdge, StructuredNode } from '@/types'

type MeceTier = 'root' | 'branch' | 'leaf'

interface MeceNodeData extends Record<string, unknown> {
  label: string
  rawLabel: string
  tier: MeceTier
  hasChildren: boolean
}

interface MeceCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

// ---- レイアウト定数（手動計算、dagreは使わない） -------------------------------
const ROOT_Y = 0
const BRANCH_Y = 180
const LEAF_START_Y = 360
const BRANCH_GAP = 240 // branch間の中心〜中心の横間隔
const LEAF_GAP = 100 // leaf間の縦間隔

const NODE_WIDTH: Record<MeceTier, number> = {
  root: 240,
  branch: 200,
  leaf: 200,
}

// ---- エッジスタイル ---------------------------------------------------------
const branchEdgeStyle: CSSProperties = { stroke: '#3b82f6', strokeWidth: 2 }
const leafEdgeStyle: CSSProperties = { stroke: '#94a3b8', strokeWidth: 1.5 }
const selectedEdgeStyle: CSSProperties = { stroke: '#ef4444', strokeWidth: 3 }

// MECEはAIモードでは category / segment / overlap / gap、
// ルールベースでは root / branch / leaf が返るため、両方をハンドリングする。
function classifyTier(role: NodeRole): MeceTier | null {
  if (role === 'unclassified') return null
  if (role === 'root' || role === 'theme' || role === 'issue_root') return 'root'
  if (role === 'branch' || role === 'category' || role === 'segment') return 'branch'
  return 'leaf'
}

function getNodeLabel(node: StructuredNode): string {
  return node.label || node.description || node.id
}

function pickRoot(nodes: StructuredNode[], edges: StructuredEdge[]): StructuredNode | undefined {
  const explicit = nodes.find((node) => classifyTier(node.role) === 'root')
  if (explicit) return explicit
  const targetIds = new Set(edges.map((edge) => edge.target))
  return nodes.find((node) => !targetIds.has(node.id)) ?? nodes[0]
}

// leafノード→親branchのマッピングを決定する。
// 優先順位: ①graph.edges ②node.parentId ③配列順の直近branch ④round-robin。
function buildLeafParentMap(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
  branches: StructuredNode[],
): Map<string, string> {
  const parentMap = new Map<string, string>()
  const branchIds = new Set(branches.map((branch) => branch.id))

  const edgeParentByTarget = new Map<string, string>()
  edges.forEach((edge) => {
    edgeParentByTarget.set(edge.target, edge.source)
  })

  let lastSeenBranchId: string | null = null
  let rrIndex = 0

  nodes.forEach((node) => {
    const tier = classifyTier(node.role)
    if (tier === 'branch') {
      lastSeenBranchId = node.id
      return
    }
    if (tier !== 'leaf') return

    const edgeParent = edgeParentByTarget.get(node.id)
    if (edgeParent && branchIds.has(edgeParent)) {
      parentMap.set(node.id, edgeParent)
      return
    }
    if (node.parentId && branchIds.has(node.parentId)) {
      parentMap.set(node.id, node.parentId)
      return
    }
    if (lastSeenBranchId) {
      parentMap.set(node.id, lastSeenBranchId)
      return
    }
    if (branches.length > 0) {
      parentMap.set(node.id, branches[rrIndex % branches.length].id)
      rrIndex += 1
    }
  })

  return parentMap
}

function getDescendantIds(rootId: string, edges: Edge[]): Set<string> {
  const out = new Set<string>()
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    edges
      .filter((edge) => edge.source === current)
      .forEach((edge) => {
        if (!out.has(edge.target)) {
          out.add(edge.target)
          queue.push(edge.target)
        }
      })
  }
  return out
}

// ---- カスタムノード（data-selected属性を出すためカスタム化） -----------------
function MeceNodeView({ data, selected }: NodeProps<Node<MeceNodeData>>) {
  const nodeData = data as MeceNodeData
  return (
    <div
      className={`mece-node mece-node--${nodeData.tier}`}
      data-selected={selected ? 'true' : 'false'}
      title={nodeData.rawLabel}
      style={{ width: NODE_WIDTH[nodeData.tier] }}
    >
      <Handle id="t" type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle id="s" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <span>{nodeData.label}</span>
    </div>
  )
}

const nodeTypes = { meceNode: MeceNodeView }

// ---- 本体 ------------------------------------------------------------------
export function MeceCanvas({ graph, onNodeEdit }: MeceCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance<Node<MeceNodeData>, Edge> | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const rootNode = useMemo(() => pickRoot(graph.nodes, graph.edges), [graph.nodes, graph.edges])
  const rootId = rootNode?.id ?? ''

  const { branches, leaves } = useMemo(() => {
    const bs: StructuredNode[] = []
    const ls: StructuredNode[] = []
    graph.nodes.forEach((node) => {
      if (node.id === rootId) return
      const tier = classifyTier(node.role)
      if (tier === 'branch') bs.push(node)
      else if (tier === 'leaf') ls.push(node)
    })
    return { branches: bs, leaves: ls }
  }, [graph.nodes, rootId])

  const leafParentMap = useMemo(
    () => buildLeafParentMap(graph.nodes, graph.edges, branches),
    [branches, graph.edges, graph.nodes],
  )

  // children map: 子の有無判定（折りたたみマーカー）と子の列挙に使う
  const childrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (rootId && branches.length > 0) {
      map.set(
        rootId,
        branches.map((node) => node.id),
      )
    }
    branches.forEach((branch) => map.set(branch.id, []))
    leaves.forEach((leaf) => {
      const parent = leafParentMap.get(leaf.id)
      if (!parent) return
      const list = map.get(parent) ?? []
      list.push(leaf.id)
      map.set(parent, list)
    })
    return map
  }, [branches, leafParentMap, leaves, rootId])

  // baseEdges: root→branch（青）、branch→leaf（グレー）
  const baseEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = []
    if (rootId) {
      branches.forEach((branch) => {
        edges.push({
          id: `${rootId}->${branch.id}`,
          source: rootId,
          target: branch.id,
          type: 'smoothstep',
          style: branchEdgeStyle,
        })
      })
    }
    leaves.forEach((leaf) => {
      const parent = leafParentMap.get(leaf.id)
      if (!parent) return
      edges.push({
        id: `${parent}->${leaf.id}`,
        source: parent,
        target: leaf.id,
        type: 'smoothstep',
        style: leafEdgeStyle,
      })
    })
    return edges
  }, [branches, leafParentMap, leaves, rootId])

  // 折りたたみ反映
  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>()
    collapsedIds.forEach((id) => {
      getDescendantIds(id, baseEdges).forEach((descId) => hidden.add(descId))
    })
    return hidden
  }, [baseEdges, collapsedIds])

  // ノード配置
  const flowNodes = useMemo<Node<MeceNodeData>[]>(() => {
    const out: Node<MeceNodeData>[] = []
    const visibleBranches = branches.filter((branch) => !hiddenIds.has(branch.id))
    const n = visibleBranches.length

    // root（上部中央）
    if (rootNode) {
      const hasChildren = (childrenMap.get(rootNode.id) ?? []).length > 0
      const collapsed = collapsedIds.has(rootNode.id)
      const marker = hasChildren ? (collapsed ? '▶ ' : '▼ ') : ''
      out.push({
        id: rootNode.id,
        type: 'meceNode',
        position: { x: -NODE_WIDTH.root / 2, y: ROOT_Y },
        data: {
          label: `${marker}${getNodeLabel(rootNode)}`,
          rawLabel: getNodeLabel(rootNode),
          tier: 'root',
          hasChildren,
        },
        draggable: true,
        selectable: true,
      })
    }

    // branches（横並び、中心は0でセンタリング）と各leafを縦積み
    visibleBranches.forEach((branch, index) => {
      const centerX = -((n - 1) * BRANCH_GAP) / 2 + index * BRANCH_GAP
      const hasChildren = (childrenMap.get(branch.id) ?? []).length > 0
      const collapsed = collapsedIds.has(branch.id)
      const marker = hasChildren ? (collapsed ? '▶ ' : '▼ ') : ''

      out.push({
        id: branch.id,
        type: 'meceNode',
        position: { x: centerX - NODE_WIDTH.branch / 2, y: BRANCH_Y },
        data: {
          label: `${marker}${getNodeLabel(branch)}`,
          rawLabel: getNodeLabel(branch),
          tier: 'branch',
          hasChildren,
        },
        draggable: true,
        selectable: true,
      })

      const childIds = (childrenMap.get(branch.id) ?? []).filter((id) => !hiddenIds.has(id))
      childIds.forEach((leafId, leafIndex) => {
        const leaf = leaves.find((node) => node.id === leafId)
        if (!leaf) return
        out.push({
          id: leaf.id,
          type: 'meceNode',
          position: {
            x: centerX - NODE_WIDTH.leaf / 2,
            y: LEAF_START_Y + leafIndex * LEAF_GAP,
          },
          data: {
            label: getNodeLabel(leaf),
            rawLabel: getNodeLabel(leaf),
            tier: 'leaf',
            hasChildren: false,
          },
          draggable: true,
          selectable: true,
        })
      })
    })

    console.log(
      '[MeceCanvas] flowNodes positions:',
      out.map((node) => ({
        id: node.id,
        tier: (node.data as MeceNodeData).tier,
        x: node.position.x,
        y: node.position.y,
      })),
    )
    return out
  }, [branches, childrenMap, collapsedIds, hiddenIds, leaves, rootNode])

  const visibleEdges = useMemo<Edge[]>(
    () =>
      baseEdges
        .filter((edge) => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target))
        .map((edge) => ({
          ...edge,
          style: edge.id === selectedEdgeId ? selectedEdgeStyle : edge.style,
        })),
    [baseEdges, hiddenIds, selectedEdgeId],
  )

  // fitView: 初回 + ノード再構築 + 折りたたみ変化
  useEffect(() => {
    if (flowNodes.length === 0) return
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [flowNodes])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({ padding: 0.25, duration: 300 })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [collapsedIds])

  const handleNodeClick: NonNullable<ReactFlowProps['onNodeClick']> = (_event, node) => {
    const hasChildren = (childrenMap.get(node.id) ?? []).length > 0
    if (!hasChildren) return
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  const handleNodeDoubleClick: NonNullable<ReactFlowProps['onNodeDoubleClick']> = (_event, node) => {
    const current = (node.data as MeceNodeData).rawLabel
    const next = window.prompt('ノードのテキストを編集', current)
    if (next === null || next.trim() === '') return
    onNodeEdit(node.id, { label: next.trim() })
  }

  return (
    <div className="mece-canvas">
      <ReactFlow<Node<MeceNodeData>, Edge>
        nodes={flowNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.1}
        zoomOnScroll
        panOnDrag
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onInit={(instance) => {
          flowInstanceRef.current = instance
          window.setTimeout(() => instance.fitView({ padding: 0.25, duration: 400 }), 250)
        }}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={(event, edge) => {
          event.stopPropagation()
          setSelectedEdgeId(edge.id)
        }}
        onPaneClick={() => setSelectedEdgeId(null)}
      >
        <Background gap={18} size={1} />
        <Controls showInteractive={false} showZoom={false} position="bottom-right">
          <ControlButton
            onClick={() => flowInstanceRef.current?.fitView({ padding: 0.25, duration: 300 })}
            title="全体表示"
          >
            □
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}
