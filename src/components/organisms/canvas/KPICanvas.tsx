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
// LAYOUT RULES — LR Spanning Tree / KPI
// ──────────────────────────────────────────────────────────────────────────────
// 1. 方向         : 左（KGI）→ 右（KPI → 施策）
// 2. ノード高さ   : parent.height = Σ child.height + gap × (n−1)
//                  → KGI/KPI ノードが子群をスパンし、エッジが水平に出て交差しない
// 3. ノードスタイル:
//    - KGI  : 濃紺背景・白文字・バッジ「KGI」（途中ノード: スパン高さ）
//    - KPI  : ティール背景・白文字・バッジ「KPI」（途中ノード: スパン高さ）
//    - 施策  : 白背景・バッジ「施策」・1行表示・テキスト幅に合わせた横幅
// 4. エッジ色     : ソースノードのレベルに対応した色（KGI=濃紺、KPI=ティール、施策=スレート）
// 5. エッジ重複なし: 親の右側の対応 Y 位置から出るため交差ゼロ
// ══════════════════════════════════════════════════════════════════════════════

// ── レベル定義 ────────────────────────────────────────────────────────────────
type KPILevel = 'kgi' | 'kpi' | 'kpi_action'

function toLevel(role: NodeRole): KPILevel {
  if (role === 'kgi') return 'kgi'
  if (role === 'kpi') return 'kpi'
  return 'kpi_action'
}

// ── デザイン定数 ──────────────────────────────────────────────────────────────
const LEVEL: Record<
  KPILevel,
  {
    bg:         string
    fg:         string
    border:     string
    shadow:     string
    radius:     number
    badge:      string
    badgeBg:    string
    badgeFg:    string
    edgeStroke: string
    edgeWidth:  number
  }
> = {
  kgi: {
    bg:         '#1a3560',
    fg:         '#ffffff',
    border:     'none',
    shadow:     '0 4px 18px rgba(26,53,96,0.30)',
    radius:     12,
    badge:      'KGI',
    badgeBg:    'rgba(255,255,255,0.18)',
    badgeFg:    '#ffffff',
    edgeStroke: '#1a3560',
    edgeWidth:  2.5,
  },
  kpi: {
    bg:         '#0d7490',
    fg:         '#ffffff',
    border:     'none',
    shadow:     '0 3px 12px rgba(13,116,144,0.22)',
    radius:     10,
    badge:      'KPI',
    badgeBg:    'rgba(255,255,255,0.18)',
    badgeFg:    '#ffffff',
    edgeStroke: '#0d7490',
    edgeWidth:  2,
  },
  kpi_action: {
    bg:         '#ffffff',
    fg:         '#1e3a5f',
    border:     '1.5px solid #c8d8ec',
    shadow:     '0 1px 5px rgba(0,0,0,0.07)',
    radius:     8,
    badge:      '施策',
    badgeBg:    '#dbeafe',
    badgeFg:    '#1e40af',
    edgeStroke: '#94a3b8',
    edgeWidth:  1.5,
  },
}

// ── カスタムノードコンポーネント ───────────────────────────────────────────────
interface KPINodeData extends Record<string, unknown> {
  label:                string
  level:                KPILevel
  sourceHandlePercents: number[]
  onEdit?: (id: string, label: string) => void
}

function KPINode({ id, data }: NodeProps) {
  const d            = data as KPINodeData
  const lv           = LEVEL[d.level]
  const isLeaf       = d.sourceHandlePercents.length === 0
  const [editing,   setEditing] = useState(false)
  const [value,     setValue]   = useState(d.label)

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
        width:        '100%',
        height:       '100%',
        background:   lv.bg,
        color:        lv.fg,
        border:       lv.border,
        borderRadius: lv.radius,
        boxShadow:    lv.shadow,
        overflow:     'hidden',
        display:      'flex',
        flexDirection: 'column',
        boxSizing:    'border-box',
        // 施策（リーフ）は CSS max-width を無効化して1行全文表示
        ...(isLeaf && { maxWidth: 'none', minWidth: 0 }),
      }}
      onDoubleClick={() => { setEditing(true); setValue(d.label) }}
      title="ダブルクリックで編集"
    >
      {/* ── 左側 Target ハンドル（常に中央 1 本） ── */}
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}
      />

      {/* ── レベルバッジ ── */}
      <div style={{
        background:    lv.badgeBg,
        color:         lv.badgeFg,
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.10em',
        textAlign:     'center',
        padding:       '3px 0',
        flexShrink:    0,
      }}>
        {lv.badge}
      </div>

      {/* ── ラベル本文 ── */}
      <div style={{
        padding:    isLeaf ? '0 10px' : '6px 10px',
        fontSize:   d.level === 'kgi' ? 14 : 12,
        fontWeight: d.level === 'kgi' ? 700 : d.level === 'kpi' ? 600 : 400,
        // リーフ: 1行表示・テキスト幅フィット・flexで縦中央
        // 途中: 折り返しあり・縦中央
        ...(isLeaf
          ? {
              whiteSpace:     'nowrap',
              wordBreak:      'normal',
              overflow:       'visible',
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              lineHeight:     1.4,
            }
          : {
              wordBreak:  'break-word',
              lineHeight: 1.4,
              flex:       1,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign:  'center',
            }
        ),
      }}>
        {editing ? (
          <textarea
            autoFocus
            value={value}
            rows={2}
            style={{
              width: '100%', resize: 'none', background: 'transparent',
              border: 'none', outline: 'none', color: 'inherit',
              fontWeight: 'inherit', fontSize: 'inherit', textAlign: 'center',
              fontFamily: 'inherit', lineHeight: 'inherit', padding: 0,
            }}
            onChange={e => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
              if (e.key === 'Escape') { setEditing(false); setValue(d.label) }
            }}
            onMouseDown={e => e.stopPropagation()}
          />
        ) : d.label}
      </div>

      {/* ── 右側 Source ハンドル（子エッジごとに動的配置） ── */}
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

const nodeTypes = { kpiNode: KPINode }

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
interface KPICanvasProps {
  graph:      FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function KPICanvas({ graph, onNodeEdit }: KPICanvasProps) {
  const version = useMemo(() => Date.now(), [graph])

  // ── Spanning Tree レイアウト ───────────────────────────────────────────────
  const laidOut = useMemo(
    () => applySpanningLayout(graph.nodes, graph.edges),
    [graph],
  )

  // ── ノードロール参照マップ ─────────────────────────────────────────────────
  const nodeRoleMap = useMemo(
    () => new Map(graph.nodes.map(n => [n.id, n.role] as [string, NodeRole])),
    [graph.nodes],
  )

  // ── 子エッジ順序マップ（sourceHandle インデックス解決用） ─────────────────
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
      laidOut.map(ln => ({
        id:         ln.id,
        type:       'kpiNode',
        position:   { x: ln.x, y: ln.y },
        width:      ln.width,
        height:     ln.height,
        draggable:  false,
        selectable: false,
        style:      { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
        data: {
          label:               graph.nodes.find(n => n.id === ln.id)?.label ?? '',
          level:               toLevel((graph.nodes.find(n => n.id === ln.id)?.role ?? 'kpi_action') as NodeRole),
          sourceHandlePercents: ln.sourceHandlePercents,
          onEdit:              (id: string, label: string) => onNodeEdit(id, { label }),
        } satisfies KPINodeData,
      })),
    [laidOut, graph.nodes, onNodeEdit],
  )

  // ── ReactFlow エッジ ───────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map(e => {
        const srcRole = nodeRoleMap.get(e.source)
        const lv      = srcRole ? LEVEL[toLevel(srcRole as NodeRole)] : LEVEL.kpi_action

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
          style:        { stroke: lv.edgeStroke, strokeWidth: lv.edgeWidth },
          markerEnd: {
            type:   MarkerType.ArrowClosed,
            color:  lv.edgeStroke,
            width:  14,
            height: 14,
          },
        }
      }),
    [graph.edges, nodeRoleMap, childrenOrderOf],
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
