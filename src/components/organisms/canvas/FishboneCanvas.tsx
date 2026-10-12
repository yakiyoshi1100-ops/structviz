import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'

import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'
import { applySpanningLayout } from './layouts/spanningTreeLayout'

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT RULES — LR Spanning Tree / Fishbone（特性要因図）
// ──────────────────────────────────────────────────────────────────────────────
// 1. 方向         : 左（問題ルート）→ 右（カテゴリー → 原因）
// 2. ノード高さ   : parent.height = Σ child.height + gap × (n−1)
//                  → 問題/カテゴリーが子群をスパン、エッジが水平に出て交差しない
// 3. ノードスタイル:
//    - fishbone_root    : 濃紺（#1a3560）背景・白文字・幅=SPAN_NODE_W
//    - カテゴリー4種    : 役割別カラー（青/ティール/紫/アンバー）・幅=SPAN_NODE_W
//    - fishbone_leaf    : 親カテゴリーの薄色背景＋同色ボーダー・テキスト幅フィット横幅
// 4. エッジ色     : ソースノードの役割色を継承
//                  （root→カテゴリーは濃紺、カテゴリー→原因はカテゴリー色）
// 5. エッジ重複なし: 親の右側の対応 Y 位置から出るため交差ゼロ
// 6. 魚骨要素なし : 脊椎・尾ひれ・頭・目は使用しない
// ══════════════════════════════════════════════════════════════════════════════

// ── カラースキーム定義 ────────────────────────────────────────────────────────
interface ColorScheme {
  bg:         string
  fg:         string
  lightBg:    string
  lightFg:    string
  border:     string
  shadow:     string
  edgeStroke: string
  edgeWidth:  number
  radius:     number
  fontWeight: number
}

const ROLE_COLOR: Partial<Record<NodeRole, ColorScheme>> = {
  fishbone_root: {
    bg:         '#1a3560',
    fg:         '#ffffff',
    lightBg:    '#1a3560',
    lightFg:    '#ffffff',
    border:     'none',
    shadow:     '0 4px 18px rgba(26,53,96,0.30)',
    edgeStroke: '#1a3560',
    edgeWidth:  2.5,
    radius:     12,
    fontWeight: 700,
  },
  fishbone_man: {
    bg:         '#3b82f6',
    fg:         '#ffffff',
    lightBg:    '#dbeafe',
    lightFg:    '#1e3a8a',
    border:     'none',
    shadow:     '0 3px 10px rgba(59,130,246,0.22)',
    edgeStroke: '#3b82f6',
    edgeWidth:  2,
    radius:     10,
    fontWeight: 600,
  },
  fishbone_method: {
    bg:         '#0d9488',
    fg:         '#ffffff',
    lightBg:    '#ccfbf1',
    lightFg:    '#134e4a',
    border:     'none',
    shadow:     '0 3px 10px rgba(13,148,136,0.22)',
    edgeStroke: '#0d9488',
    edgeWidth:  2,
    radius:     10,
    fontWeight: 600,
  },
  fishbone_machine: {
    bg:         '#8b5cf6',
    fg:         '#ffffff',
    lightBg:    '#ede9fe',
    lightFg:    '#4c1d95',
    border:     'none',
    shadow:     '0 3px 10px rgba(139,92,246,0.22)',
    edgeStroke: '#8b5cf6',
    edgeWidth:  2,
    radius:     10,
    fontWeight: 600,
  },
  fishbone_material: {
    bg:         '#f59e0b',
    fg:         '#ffffff',
    lightBg:    '#fef3c7',
    lightFg:    '#78350f',
    border:     'none',
    shadow:     '0 3px 10px rgba(245,158,11,0.22)',
    edgeStroke: '#f59e0b',
    edgeWidth:  2,
    radius:     10,
    fontWeight: 600,
  },
}

const FALLBACK_SCHEME: ColorScheme = {
  bg:         '#6b7280',
  fg:         '#ffffff',
  lightBg:    '#f3f4f6',
  lightFg:    '#1f2937',
  border:     '1.5px solid #d1d5db',
  shadow:     '0 1px 5px rgba(0,0,0,0.07)',
  edgeStroke: '#94a3b8',
  edgeWidth:  1.5,
  radius:     8,
  fontWeight: 400,
}

// ── カスタムノードコンポーネント ───────────────────────────────────────────────
interface FishNodeData extends Record<string, unknown> {
  label:                string
  bg:                   string
  fg:                   string
  border:               string
  shadow:               string
  radius:               number
  fontSize:             number
  fontWeight:           number
  isLeaf:               boolean
  sourceHandlePercents: number[]
  onEdit?: (id: string, label: string) => void
}

function FishNode({ id, data }: NodeProps) {
  const d = data as FishNodeData
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(d.label)

  useEffect(() => setValue(d.label), [d.label])

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== d.label) d.onEdit?.(id, t)
    else setValue(d.label)
  }

  return (
    <div
      style={{
        width:          '100%',
        height:         '100%',
        background:     d.bg,
        color:          d.fg,
        border:         d.border,
        borderRadius:   d.radius,
        boxShadow:      d.shadow,
        boxSizing:      'border-box',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '6px 10px',
        overflow:       'hidden',
        ...(d.isLeaf && { maxWidth: 'none', minWidth: 0 }),
      }}
      onDoubleClick={() => { setEditing(true); setValue(d.label) }}
      title="ダブルクリックで編集"
    >
      {/* 左側 Target ハンドル */}
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}
      />

      {editing ? (
        <textarea
          autoFocus
          value={value}
          rows={2}
          style={{
            width: '100%', resize: 'none', background: 'transparent',
            border: 'none', outline: 'none', color: 'inherit',
            fontWeight: 'inherit', fontSize: 'inherit', textAlign: 'center',
            fontFamily: 'inherit', lineHeight: '1.4', padding: 0,
          }}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setEditing(false); setValue(d.label) }
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <span style={
          d.isLeaf
            ? {
                whiteSpace:  'nowrap',
                wordBreak:   'normal',
                overflow:    'visible',
                fontSize:    d.fontSize,
                fontWeight:  d.fontWeight,
                lineHeight:  1.4,
              }
            : {
                wordBreak:   'break-word',
                textAlign:   'center',
                fontSize:    d.fontSize,
                fontWeight:  d.fontWeight,
                lineHeight:  1.4,
              }
        }>
          {d.label}
        </span>
      )}

      {/* 右側 Source ハンドル（子エッジごとに動的配置） */}
      {d.sourceHandlePercents.length > 0 ? (
        d.sourceHandlePercents.map((pct, i) => (
          <Handle
            key={`src-${i}`}
            id={`src-${i}`}
            type="source"
            position={Position.Right}
            style={{ opacity: 0, pointerEvents: 'none', top: `${pct * 100}%` }}
          />
        ))
      ) : (
        <Handle
          id="src-0"
          type="source"
          position={Position.Right}
          style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}
        />
      )}
    </div>
  )
}

const nodeTypes = { fishNode: FishNode }

// ── AutoFitView ───────────────────────────────────────────────────────────────
function AutoFitView({ version }: { version: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.18, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [version, fitView])
  return null
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface FishboneCanvasProps {
  graph:       FrameworkGraph
  onNodeEdit?: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function FishboneCanvas({ graph, onNodeEdit }: FishboneCanvasProps) {
  const version = useMemo(() => Date.now(), [graph])

  // ── Spanning Tree レイアウト ───────────────────────────────────────────────
  const laidOut = useMemo(
    () => applySpanningLayout(graph.nodes, graph.edges),
    [graph],
  )

  // ── ノードマップ ───────────────────────────────────────────────────────────
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map(n => [n.id, n])),
    [graph.nodes],
  )

  // ── カラーマップ（BFS で原因ノードに親カテゴリー色を継承） ─────────────────
  // fishbone_root   → root color
  // カテゴリー4種   → 役割別カラー
  // fishbone_leaf   → 親カテゴリーの lightBg / lightFg
  const colorMap = useMemo(() => {
    const m = new Map<string, ColorScheme>()

    // 有向隣接リスト
    const childrenOf = new Map<string, string[]>()
    const hasParent  = new Set<string>()
    graph.nodes.forEach(n => childrenOf.set(n.id, []))
    graph.edges.forEach(e => {
      const list = childrenOf.get(e.source)
      if (list && !list.includes(e.target)) list.push(e.target)
      hasParent.add(e.target)
    })

    // BFS でルートから伝播
    const roots   = graph.nodes.filter(n => !hasParent.has(n.id))
    const queue: Array<{ id: string; parentScheme: ColorScheme | null }> =
      roots.map(r => ({ id: r.id, parentScheme: null }))
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, parentScheme } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)

      const node = nodeMap.get(id)
      if (!node) continue

      // このノードのカラースキームを決定
      let scheme: ColorScheme
      const roleScheme = ROLE_COLOR[node.role as NodeRole]
      if (roleScheme) {
        // 役割定義色あり（root / カテゴリー4種）
        scheme = roleScheme
      } else if (parentScheme) {
        // 原因ノード（fishbone_leaf 等）: 親カテゴリーの薄色を使用
        scheme = {
          ...parentScheme,
          bg:         parentScheme.lightBg,
          fg:         parentScheme.lightFg,
          border:     `1.5px solid ${parentScheme.edgeStroke}`,
          shadow:     '0 1px 5px rgba(0,0,0,0.07)',
          radius:     8,
          fontWeight: 400,
        }
      } else {
        scheme = FALLBACK_SCHEME
      }
      m.set(id, scheme)

      // 子ノードをキューに追加
      const children = childrenOf.get(id) ?? []
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, parentScheme: scheme })
        }
      })
    }

    // 孤立ノード
    graph.nodes.forEach(n => {
      if (!m.has(n.id)) {
        m.set(n.id, ROLE_COLOR[n.role as NodeRole] ?? FALLBACK_SCHEME)
      }
    })

    return m
  }, [graph.nodes, graph.edges, nodeMap])

  // ── 子エッジ順序マップ ─────────────────────────────────────────────────────
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
  const flowNodes = useMemo<Node[]>(
    () =>
      laidOut.map(ln => {
        const node   = nodeMap.get(ln.id)
        const scheme = colorMap.get(ln.id) ?? FALLBACK_SCHEME
        const isLeaf = ln.sourceHandlePercents.length === 0
        const isRoot = node?.role === 'fishbone_root'

        return {
          id:         ln.id,
          type:       'fishNode',
          position:   { x: ln.x, y: ln.y },
          width:      ln.width,
          height:     ln.height,
          draggable:  false,
          selectable: false,
          style:      { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
          data: {
            label:               node?.label ?? '',
            bg:                  scheme.bg,
            fg:                  scheme.fg,
            border:              scheme.border,
            shadow:              scheme.shadow,
            radius:              scheme.radius,
            fontSize:            isRoot ? 14 : isLeaf ? 12 : 13,
            fontWeight:          scheme.fontWeight,
            isLeaf,
            sourceHandlePercents: ln.sourceHandlePercents,
            onEdit: onNodeEdit
              ? (id: string, label: string) => onNodeEdit(id, { label })
              : undefined,
          } satisfies FishNodeData,
        }
      }),
    [laidOut, nodeMap, colorMap, onNodeEdit],
  )

  // ── ReactFlow エッジ ───────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map(e => {
        const scheme   = colorMap.get(e.source) ?? FALLBACK_SCHEME
        const siblings = childrenOrderOf.get(e.source) ?? []
        const childIdx = siblings.indexOf(e.target)

        return {
          id:           e.id,
          source:       e.source,
          target:       e.target,
          sourceHandle: `src-${childIdx}`,
          targetHandle: 'target',
          label:        e.label,
          type:         'smoothstep',
          style:        { stroke: scheme.edgeStroke, strokeWidth: scheme.edgeWidth },
          markerEnd: {
            type:   MarkerType.ArrowClosed,
            color:  scheme.edgeStroke,
            width:  14,
            height: 14,
          },
        }
      }),
    [graph.edges, colorMap, childrenOrderOf],
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll
        panOnDrag
        minZoom={0.05}
      >
        <AutoFitView version={version} />
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
