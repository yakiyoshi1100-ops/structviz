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

import type { FrameworkGraph, StructuredEdge, StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT RULES — TB Spanning Tree / Pyramid
// ──────────────────────────────────────────────────────────────────────────────
// 1. 方向         : 上（結論）→ 下（根拠）
// 2. ノード幅     : parent.width = Σ child.width + gap × (n−1)
//                  → 結論/理由が子群を横にスパンし、エッジが垂直に出て交差しない
// 3. ノード高さ   : 役割ごとに固定（行数で決まる）
//    - conclusion : 1行分 = 52px
//    - argument   : 2行分 = 68px
//    - evidence   : 3行分 = 84px
// 4. エッジ       : 親の底面の対応 X 位置から垂直に下り、子の天面中央に到達
// 5. フォールバック: LLMがエッジを出力しなかった場合は自動生成
// 6. 方向正規化   : LLMが下→上で出力した場合は自動反転して「結論が上」に統一
// ══════════════════════════════════════════════════════════════════════════════

// ── ロール → レベル マッピング ────────────────────────────────────────────────
type Level = 'conclusion' | 'argument' | 'evidence'

const ROLE_TO_LEVEL: Record<string, Level> = {
  conclusion: 'conclusion', root: 'conclusion',
  argument:   'argument',   branch: 'argument',
  evidence:   'evidence',   leaf: 'evidence', 'root-cause': 'evidence',
}

// ── レベルごとのノード高さ（conclusion/argument は固定、evidence は動的） ──────
const LEVEL_H_BASE: Record<Level, number> = {
  conclusion: 52,   // 1行: font14px × 1.45 + padding28px
  argument:   68,   // 2行: font13px × 1.45 × 2 + padding20px
  evidence:   0,    // 動的計算（根拠層の最大テキスト量で決定）
}

// ── TB Spanning レイアウト定数 ───────────────────────────────────────────────
const LEAF_W          = 160   // px — evidence ノードの固定幅
const H_GAP           = 10    // px — 兄弟ノード間の水平ギャップ
const V_GAP           = 20    // px — 深さレベル間の垂直ギャップ
const EV_FONT_SIZE    = 12    // px — evidence ノードのフォントサイズ
const EV_LINE_H       = EV_FONT_SIZE * 1.45   // px — evidence 1行の高さ
const EV_PADDING_V    = 16    // px — evidence 上下合計パディング
const EV_PADDING_H    = 24    // px — evidence 左右合計パディング（テキスト幅計算用）
const EV_MIN_H        = 56    // px — evidence ノードの最小高さ

// ── evidence ノードのテキスト行数から必要高さを計算 ──────────────────────────
// Unicode 範囲で全角/半角を判定し、LEAF_W 内での折り返し行数を推定する
function measureEvidenceHeight(text: string): number {
  const availableW = LEAF_W - EV_PADDING_H
  let lineWidth = 0
  let lines = 1
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0
    const cw = (
      (cp >= 0x2E80 && cp <= 0x9FFF) ||
      (cp >= 0xF900 && cp <= 0xFAFF) ||
      (cp >= 0xFE10 && cp <= 0xFE6F) ||
      (cp >= 0xFF00 && cp <= 0xFF60)
    ) ? EV_FONT_SIZE * 1.05 : EV_FONT_SIZE * 0.60
    if (lineWidth + cw > availableW) {
      lines++
      lineWidth = cw
    } else {
      lineWidth += cw
    }
  }
  return Math.max(EV_MIN_H, Math.ceil(lines * EV_LINE_H + EV_PADDING_V))
}

// ── ノードスタイル ────────────────────────────────────────────────────────────
const LEVEL_STYLE: Record<Level, React.CSSProperties> = {
  conclusion: {
    background:   '#1a3560',
    color:        '#ffffff',
    border:       'none',
    borderRadius: 12,
    padding:      '14px 20px',
    fontWeight:   700,
    fontSize:     14,
    textAlign:    'center',
    boxShadow:    '0 4px 18px rgba(26,53,96,0.28)',
    lineHeight:   1.45,
  },
  argument: {
    background:   '#e6f0fa',
    color:        '#1a3560',
    border:       '2px solid #7baad4',
    borderRadius: 10,
    padding:      '10px 14px',
    fontWeight:   600,
    fontSize:     13,
    textAlign:    'center',
    boxShadow:    '0 2px 8px rgba(26,53,96,0.10)',
    lineHeight:   1.45,
  },
  evidence: {
    background:   '#ffffff',
    color:        '#374151',
    border:       '1.5px solid #d1d5db',
    borderRadius: 8,
    padding:      '8px 12px',
    fontWeight:   400,
    fontSize:     12,
    textAlign:    'center',
    boxShadow:    '0 1px 4px rgba(0,0,0,0.07)',
    lineHeight:   1.45,
  },
}

// ── TB Spanning レイアウト関数 ────────────────────────────────────────────────
interface TBLayoutNode {
  id:                   string
  x:                    number
  y:                    number
  width:                number
  height:               number
  level:                Level
  /** 子エッジ接続点の X 位置（ノード幅に対する割合 [0,1]）*/
  sourceHandlePercents: number[]
}

function applySpanningLayoutTB(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
): TBLayoutNode[] {
  if (nodes.length === 0) return []

  const nodeIds = new Set(nodes.map(n => n.id))

  // 有向隣接リスト（重複除外）
  const childrenOf = new Map<string, string[]>()
  const hasParent  = new Set<string>()
  nodes.forEach(n => childrenOf.set(n.id, []))
  edges.forEach(e => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return
    const list = childrenOf.get(e.source)!
    if (!list.includes(e.target)) {
      list.push(e.target)
      hasParent.add(e.target)
    }
  })

  // ルートノード
  const roots = nodes.filter(n => !hasParent.has(n.id))
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0])

  // BFS で深さを割り当て
  const depthOf = new Map<string, number>()
  const bfsQ: { id: string; d: number }[] = roots.map(r => ({ id: r.id, d: 0 }))
  while (bfsQ.length > 0) {
    const { id, d } = bfsQ.shift()!
    if (depthOf.has(id)) continue
    depthOf.set(id, d)
    childrenOf.get(id)?.forEach(c => bfsQ.push({ id: c, d: d + 1 }))
  }

  // 幅の再帰計算（parent.width = Σ child.width + H_GAP × (n-1)）
  const widthOf = new Map<string, number>()
  function computeWidth(id: string): number {
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) {
      widthOf.set(id, LEAF_W)
      return LEAF_W
    }
    const w = children.reduce((s, c) => s + computeWidth(c), 0)
            + H_GAP * (children.length - 1)
    widthOf.set(id, w)
    return w
  }
  roots.forEach(r => computeWidth(r.id))

  // ノード配置（左端 X 座標）
  const leftXOf = new Map<string, number>()
  function place(id: string, xLeft: number) {
    leftXOf.set(id, xLeft)
    let cx = xLeft
    childrenOf.get(id)?.forEach(cId => {
      place(cId, cx)
      cx += (widthOf.get(cId) ?? LEAF_W) + H_GAP
    })
  }
  let rootX = 0
  roots.forEach(r => {
    place(r.id, rootX)
    rootX += (widthOf.get(r.id) ?? LEAF_W) + H_GAP
  })

  // 孤立ノード
  nodes.forEach(n => {
    if (!leftXOf.has(n.id)) {
      leftXOf.set(n.id, rootX)
      widthOf.set(n.id, LEAF_W)
      depthOf.set(n.id, 0)
      rootX += LEAF_W + H_GAP
    }
  })

  // ── evidence 層の最大高さを全leaf テキストから算出 ────────────────────────
  // 同じ層のノードは余白があっても最大高さに揃える
  const leafNodes      = nodes.filter(n => (childrenOf.get(n.id) ?? []).length === 0)
  const maxEvidenceH   = leafNodes.length > 0
    ? Math.max(...leafNodes.map(n => measureEvidenceHeight(n.label)))
    : EV_MIN_H

  // LEVEL_H を evidence のみ動的値で上書き
  const LEVEL_H: Record<Level, number> = { ...LEVEL_H_BASE, evidence: maxEvidenceH }

  // 深さレベルごとの Y 座標（各深さの最大高さ + V_GAP）
  const maxDepth    = Math.max(0, ...depthOf.values())
  const depthYMap   = new Map<number, number>()
  const nodeByDepth = new Map<number, StructuredNode[]>()
  nodes.forEach(n => {
    const d = depthOf.get(n.id) ?? 0
    if (!nodeByDepth.has(d)) nodeByDepth.set(d, [])
    nodeByDepth.get(d)!.push(n)
  })

  let yAcc = 0
  for (let d = 0; d <= maxDepth; d++) {
    depthYMap.set(d, yAcc)
    const levelH = Math.max(
      ...(nodeByDepth.get(d) ?? []).map(n => LEVEL_H[ROLE_TO_LEVEL[n.role] ?? 'evidence']),
      EV_MIN_H,
    )
    yAcc += levelH + V_GAP
  }

  // 結果構築
  return nodes.map(n => {
    const xLeft  = leftXOf.get(n.id)!
    const width  = widthOf.get(n.id)!
    const depth  = depthOf.get(n.id) ?? 0
    const y      = depthYMap.get(depth)!
    const level  = ROLE_TO_LEVEL[n.role] ?? 'evidence'
    const height = LEVEL_H[level]

    const children = childrenOf.get(n.id) ?? []
    const sourceHandlePercents = children.map(cId => {
      const cx = leftXOf.get(cId)!
      const cw = widthOf.get(cId)!
      return (cx + cw / 2 - xLeft) / width
    })

    return { id: n.id, x: xLeft, y, width, height, level, sourceHandlePercents }
  })
}

// ── カスタムノードコンポーネント ───────────────────────────────────────────────
interface PyramidNodeData extends Record<string, unknown> {
  label:                string
  level:                Level
  sourceHandlePercents: number[]
  onEdit?: (nodeId: string, label: string) => void
}

// 行数上限（conclusion/argument のみ使用; evidence は動的高さなので clamp しない）
const LINES: Record<'conclusion' | 'argument', number> = { conclusion: 1, argument: 2 }

function PyramidNode({ id, data }: NodeProps) {
  const d = data as PyramidNodeData
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(d.label)

  useEffect(() => setValue(d.label), [d.label])

  const commit = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== d.label) d.onEdit?.(id, trimmed)
    else setValue(d.label)
  }

  const editRows = d.level === 'evidence' ? 4 : LINES[d.level as 'conclusion' | 'argument']

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        boxSizing:  'border-box',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...LEVEL_STYLE[d.level],
      }}
      onDoubleClick={() => { setEditing(true); setValue(d.label) }}
      title="ダブルクリックで編集"
    >
      {/* 天面 Target ハンドル（中央 1 本） */}
      <Handle
        id="target"
        type="target"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: 'none', left: '50%' }}
      />

      {editing ? (
        <textarea
          autoFocus
          value={value}
          rows={editRows}
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
      ) : d.level === 'evidence' ? (
        // evidence: 動的高さに合わせて全文表示（clamp なし）
        <span style={{ wordBreak: 'break-word' }}>
          {d.label}
        </span>
      ) : (
        // conclusion / argument: 行数上限クランプ
        <span style={{
          display:           '-webkit-box',
          WebkitLineClamp:   LINES[d.level as 'conclusion' | 'argument'],
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
          wordBreak:         'break-word',
        }}>
          {d.label}
        </span>
      )}

      {/* 底面 Source ハンドル（子エッジごとに動的配置） */}
      {d.sourceHandlePercents.length > 0 ? (
        d.sourceHandlePercents.map((pct, i) => (
          <Handle
            key={`src-${i}`}
            id={`src-${i}`}
            type="source"
            position={Position.Bottom}
            style={{ opacity: 0, pointerEvents: 'none', left: `${pct * 100}%` }}
          />
        ))
      ) : (
        <Handle
          id="src-0"
          type="source"
          position={Position.Bottom}
          style={{ opacity: 0, pointerEvents: 'none', left: '50%' }}
        />
      )}
    </div>
  )
}

const nodeTypes = { pyramidNode: PyramidNode }

// ── AutoFitView ───────────────────────────────────────────────────────────────
function AutoFitView({ version }: { version: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.22, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [version, fitView])
  return null
}

// ── LLM がエッジを出力しなかった場合のフォールバック ─────────────────────────
function makeFallbackEdges(nodes: StructuredNode[]): StructuredEdge[] {
  const conclusions = nodes.filter(n => ['conclusion', 'root'].includes(n.role))
  const args        = nodes.filter(n => ['argument', 'branch'].includes(n.role))
  const evidence    = nodes.filter(n => !['conclusion', 'root', 'argument', 'branch'].includes(n.role))
  const root = conclusions[0]
  if (!root) return []
  const edges: StructuredEdge[] = []
  args.forEach(a =>
    edges.push({ id: `fb_${root.id}_${a.id}`, source: root.id, target: a.id, label: '論拠' }),
  )
  const nArgs = Math.max(args.length, 1)
  evidence.forEach((ev, i) => {
    const parent = args[i % nArgs] ?? root
    edges.push({ id: `fb_${parent.id}_${ev.id}_${i}`, source: parent.id, target: ev.id })
  })
  return edges
}

// ── エッジ方向の正規化（LLM が下から上で出力した場合に反転） ─────────────────
function normalizeEdges(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
): StructuredEdge[] {
  if (edges.length === 0) return edges
  const conclusionIds = new Set(
    nodes.filter(n => ['conclusion', 'root'].includes(n.role)).map(n => n.id),
  )
  const isBottomUp = edges.some(e => conclusionIds.has(e.target))
  if (isBottomUp) {
    return edges.map(e => ({ ...e, id: `rev_${e.id}`, source: e.target, target: e.source }))
  }
  return edges
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface PyramidCanvasProps {
  graph:      FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function PyramidCanvas({ graph, onNodeEdit }: PyramidCanvasProps) {
  const version = useMemo(() => Date.now(), [graph])

  // エッジ前処理: フォールバック生成 + 方向正規化
  const edges = useMemo(() => {
    const raw = graph.edges.length > 0 ? graph.edges : makeFallbackEdges(graph.nodes)
    return normalizeEdges(graph.nodes, raw)
  }, [graph])

  // TB Spanning レイアウト
  const laidOut = useMemo(
    () => applySpanningLayoutTB(graph.nodes, edges),
    [graph.nodes, edges],
  )

  // 子エッジ順序マップ（sourceHandle インデックス解決用）
  const childrenOrderOf = useMemo(() => {
    const m = new Map<string, string[]>()
    edges.forEach(e => {
      if (!m.has(e.source)) m.set(e.source, [])
      const list = m.get(e.source)!
      if (!list.includes(e.target)) list.push(e.target)
    })
    return m
  }, [edges])

  // ノード ID → レイアウト情報の参照マップ
  const layoutMap = useMemo(
    () => new Map(laidOut.map(n => [n.id, n])),
    [laidOut],
  )

  const flowNodes = useMemo<Node[]>(
    () =>
      laidOut.map(ln => ({
        id:         ln.id,
        type:       'pyramidNode',
        position:   { x: ln.x, y: ln.y },
        width:      ln.width,
        height:     ln.height,
        draggable:  false,
        selectable: false,
        style:      { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
        data: {
          label:               graph.nodes.find(n => n.id === ln.id)?.label ?? '',
          level:               ln.level,
          sourceHandlePercents: ln.sourceHandlePercents,
          onEdit:              (id: string, label: string) => onNodeEdit(id, { label }),
        } satisfies PyramidNodeData,
      })),
    [laidOut, graph.nodes, onNodeEdit],
  )

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map(e => {
        const siblings = childrenOrderOf.get(e.source) ?? []
        const childIdx = siblings.indexOf(e.target)
        const srcLevel = layoutMap.get(e.source)?.level ?? 'argument'
        const color    = srcLevel === 'conclusion' ? '#1a3560' : '#94a3b8'
        const width    = srcLevel === 'conclusion' ? 2.0 : 1.5

        return {
          id:           e.id,
          source:       e.source,
          target:       e.target,
          sourceHandle: `src-${childIdx}`,
          targetHandle: 'target',
          label:        e.label,
          type:         'smoothstep',
          style:        { stroke: color, strokeWidth: width },
          markerEnd:    { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
          labelStyle:   { fontSize: 10, fill: '#6b7280' },
          labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.85 },
        }
      }),
    [edges, childrenOrderOf, layoutMap],
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll
        panOnDrag
        minZoom={0.06}
      >
        <AutoFitView version={version} />
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
