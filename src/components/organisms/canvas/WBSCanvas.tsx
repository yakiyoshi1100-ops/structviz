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

import type { FrameworkGraph, StructuredNode } from '@/types'
import { applySpanningLayout } from './layouts/spanningTreeLayout'

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT RULES — LR Spanning Tree / WBS（作業分解構造）
// ──────────────────────────────────────────────────────────────────────────────
// 1. 方向         : 左（プロジェクトルート）→ 右（フェーズ → タスク → サブタスク）
// 2. ノード高さ   : parent.height = Σ child.height + gap × (n−1)
//                  → フェーズ/タスクが子群をスパン、エッジが水平に出て交差しない
// 3. ノードスタイル:
//    - wbs_root     : スレート濃色（#334155）背景・白文字・縦書きテキスト
//    - wbs_phase    : フェーズ順に PALETTE を循環割り当て・vivid 色・太字
//    - wbs_task     : 同フェーズ vivid 色・600 weight・spanning 高さ
//    - wbs_subtask  : 同フェーズ light 色＋vivid ボーダー・テキスト幅フィット横幅
// 4. エッジ色     : ソースノードのフェーズ色を継承（root→フェーズはスレート）
// 5. エッジ重複なし: 親の右側の対応 Y 位置から出るため交差ゼロ
// ══════════════════════════════════════════════════════════════════════════════

// ── フェーズカラーパレット（最大6フェーズ、循環） ─────────────────────────────
const PALETTE = [
  { main: '#0d9488', light: '#ccfbf1', onMain: '#ffffff', onLight: '#134e4a' }, // teal
  { main: '#3b82f6', light: '#dbeafe', onMain: '#ffffff', onLight: '#1e3a8a' }, // blue
  { main: '#f59e0b', light: '#fef3c7', onMain: '#1a1a1a', onLight: '#78350f' }, // amber
  { main: '#8b5cf6', light: '#ede9fe', onMain: '#ffffff', onLight: '#4c1d95' }, // violet
  { main: '#ef4444', light: '#fee2e2', onMain: '#ffffff', onLight: '#7f1d1d' }, // red
  { main: '#22c55e', light: '#dcfce7', onMain: '#ffffff', onLight: '#14532d' }, // green
] as const

type PaletteEntry = typeof PALETTE[number]

// ── ノードカラースキーム ───────────────────────────────────────────────────────
interface NodeColor {
  bg:         string
  fg:         string
  border:     string
  shadow:     string
  edgeStroke: string
  edgeWidth:  number
}

// ── カスタムノードコンポーネント ───────────────────────────────────────────────
interface WBSNodeData extends Record<string, unknown> {
  label:                string
  role:                 string
  bg:                   string
  fg:                   string
  border:               string
  shadow:               string
  isLeaf:               boolean
  sourceHandlePercents: number[]
  onEdit?: (id: string, label: string) => void
}

function WBSNode({ id, data }: NodeProps) {
  const d = data as WBSNodeData
  const isRoot  = d.role === 'wbs_root'
  const isPhase = d.role === 'wbs_phase'
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(d.label)

  useEffect(() => setValue(d.label), [d.label])

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== d.label) d.onEdit?.(id, t)
    else setValue(d.label)
  }

  const radius     = isRoot ? 12 : isPhase ? 10 : 8
  const fontSize   = isRoot ? 13 : isPhase ? 14 : 12
  const fontWeight = isRoot ? 700 : isPhase ? 700 : d.role === 'wbs_task' ? 600 : 400

  return (
    <div
      style={{
        width:          '100%',
        height:         '100%',
        background:     d.bg,
        color:          d.fg,
        border:         d.border,
        borderRadius:   radius,
        boxShadow:      d.shadow,
        boxSizing:      'border-box',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        isRoot ? '10px 0' : '6px 10px',
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
            width:      isRoot ? 'auto' : '100%',
            height:     isRoot ? '80%'  : 'auto',
            resize:     'none',
            background: 'transparent',
            border:     'none',
            outline:    'none',
            color:      'inherit',
            fontWeight,
            fontSize,
            textAlign:  'center',
            fontFamily: 'inherit',
            lineHeight: '1.4',
            padding:    0,
            ...(isRoot && { writingMode: 'vertical-rl' as const }),
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
        <span
          style={
            isRoot
              ? {
                  writingMode:   'vertical-rl' as React.CSSProperties['writingMode'],
                  transform:     'rotate(180deg)',
                  fontSize,
                  fontWeight,
                  letterSpacing: '0.08em',
                  whiteSpace:    'nowrap',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  maxHeight:     '90%',
                }
              : d.isLeaf
              ? {
                  whiteSpace:  'nowrap',
                  wordBreak:   'normal',
                  overflow:    'visible',
                  fontSize,
                  fontWeight,
                  lineHeight:  1.4,
                }
              : {
                  wordBreak:   'break-word',
                  textAlign:   'center',
                  fontSize,
                  fontWeight,
                  lineHeight:  1.4,
                }
          }
        >
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

const nodeTypes = { wbsNode: WBSNode }

// ── AutoFitView ───────────────────────────────────────────────────────────────
function AutoFitView({ version }: { version: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.15, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [version, fitView])
  return null
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface WBSCanvasProps {
  graph:       FrameworkGraph
  onNodeEdit?: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function WBSCanvas({ graph, onNodeEdit }: WBSCanvasProps) {
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

  // ── カラーマップ（フェーズ単位で PALETTE を循環割り当て、子孫に継承） ────────
  // wbs_root     → スレート濃色
  // wbs_phase    → PALETTE[i] vivid（フェーズ出現順）
  // wbs_task     → 同フェーズ vivid（border あり）
  // wbs_subtask  → 同フェーズ light
  const colorMap = useMemo(() => {
    const m = new Map<string, NodeColor>()

    // 有向隣接リスト（重複除外）
    const childrenOf = new Map<string, string[]>()
    const hasParent  = new Set<string>()
    graph.nodes.forEach(n => childrenOf.set(n.id, []))
    graph.edges.forEach(e => {
      const list = childrenOf.get(e.source)
      if (list && !list.includes(e.target)) list.push(e.target)
      hasParent.add(e.target)
    })

    // ルートノード
    const roots   = graph.nodes.filter(n => !hasParent.has(n.id))
    const rootNode = graph.nodes.find(n => n.role === 'wbs_root') ?? roots[0]
    if (!rootNode) return m

    m.set(rootNode.id, {
      bg:         '#334155',
      fg:         '#ffffff',
      border:     'none',
      shadow:     '0 4px 18px rgba(51,65,85,0.28)',
      edgeStroke: '#64748b',
      edgeWidth:  2,
    })

    // ルートの直接子（フェーズ）に PALETTE を順番に割り当て
    const phaseIds = childrenOf.get(rootNode.id) ?? []
    let palIdx = 0

    // phaseOf: nodeId → フェーズの PaletteEntry（フェーズ自身含む）
    const phaseOf = new Map<string, PaletteEntry>()
    phaseIds.forEach(phId => {
      const pal = PALETTE[palIdx++ % PALETTE.length]
      // BFS でフェーズ配下の全ノードに同じパレットを割り当て
      const q   = [phId]
      const vis = new Set([phId])
      while (q.length > 0) {
        const id = q.shift()!
        phaseOf.set(id, pal)
        childrenOf.get(id)?.forEach(cId => {
          if (!vis.has(cId)) { vis.add(cId); q.push(cId) }
        })
      }
    })

    // 各ノードのカラーをロールで決定
    graph.nodes.forEach(n => {
      if (m.has(n.id)) return          // root は設定済み
      const pal = phaseOf.get(n.id)
      if (!pal) {
        // 孤立ノード
        m.set(n.id, { bg: '#6b7280', fg: '#fff', border: '1.5px solid #d1d5db', shadow: '', edgeStroke: '#94a3b8', edgeWidth: 1.5 })
        return
      }
      if (n.role === 'wbs_phase') {
        m.set(n.id, {
          bg:         pal.main,
          fg:         pal.onMain,
          border:     'none',
          shadow:     `0 3px 14px ${pal.main}40`,
          edgeStroke: pal.main,
          edgeWidth:  2,
        })
      } else if (n.role === 'wbs_task') {
        m.set(n.id, {
          bg:         pal.main,
          fg:         pal.onMain,
          border:     '1.5px solid rgba(0,0,0,0.10)',
          shadow:     `0 1px 6px ${pal.main}30`,
          edgeStroke: pal.main,
          edgeWidth:  1.8,
        })
      } else {
        // wbs_subtask またはそれ以深（リーフ）
        m.set(n.id, {
          bg:         pal.light,
          fg:         pal.onLight,
          border:     `1.5px solid ${pal.main}70`,
          shadow:     '0 1px 4px rgba(0,0,0,0.07)',
          edgeStroke: pal.main,
          edgeWidth:  1.5,
        })
      }
    })

    return m
  }, [graph.nodes, graph.edges])

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
        const color  = colorMap.get(ln.id) ?? {
          bg: '#6b7280', fg: '#fff', border: '', shadow: '',
          edgeStroke: '#94a3b8', edgeWidth: 1.5,
        }
        const isLeaf = ln.sourceHandlePercents.length === 0

        return {
          id:         ln.id,
          type:       'wbsNode',
          position:   { x: ln.x, y: ln.y },
          width:      ln.width,
          height:     ln.height,
          draggable:  false,
          selectable: false,
          style:      { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
          data: {
            label:               node?.label ?? '',
            role:                node?.role ?? '',
            bg:                  color.bg,
            fg:                  color.fg,
            border:              color.border,
            shadow:              color.shadow,
            isLeaf,
            sourceHandlePercents: ln.sourceHandlePercents,
            onEdit: onNodeEdit
              ? (id: string, label: string) => onNodeEdit(id, { label })
              : undefined,
          } satisfies WBSNodeData,
        }
      }),
    [laidOut, nodeMap, colorMap, onNodeEdit],
  )

  // ── ReactFlow エッジ ───────────────────────────────────────────────────────
  const flowEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map(e => {
        const color    = colorMap.get(e.source) ?? { edgeStroke: '#94a3b8', edgeWidth: 1.5 }
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
          style:        { stroke: color.edgeStroke, strokeWidth: color.edgeWidth },
          markerEnd: {
            type:   MarkerType.ArrowClosed,
            color:  color.edgeStroke,
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
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll
        panOnDrag
        minZoom={0.04}
      >
        <AutoFitView version={version} />
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
