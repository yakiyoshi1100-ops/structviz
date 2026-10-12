import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// PEST分析 ハブ＆スポーク キャンバス
// ──────────────────────────────────────────────────────────────────────────────
//  レイアウト:
//
//              ┌────────────────────┐
//              │  P: 政治・法律      │
//              └────────┬───────────┘
//                       │↓
//  ┌──────────┐  ┌──────┴──────┐  ┌──────────┐
//  │T: 技術   │→ │  業界環境   │ ←│ E: 経済  │
//  └──────────┘  └──────┬──────┘  └──────────┘
//                       │↑
//              ┌────────┴───────────┐
//              │  S: 社会・文化      │
//              └────────────────────┘
//
//  - P/S は中央カラム（横広め）
//  - T/E は左右カラム
//  - 矢印は ResizeObserver で実測した座標に基づき SVG で描画
//  - チップはドラッグ&ドロップで象限間を移動可能
// ══════════════════════════════════════════════════════════════════════════════

// ── 象限定義 ──────────────────────────────────────────────────────────────────
interface QuadrantDef {
  role:    NodeRole
  letter:  string
  label:   string
  labelEn: string
  desc:    string
  header:  string
  bg:      string
  chip:    string
  chipFg:  string
  divider: string
}

const Q_POLITICAL: QuadrantDef = {
  role: 'political', letter: 'P', label: '政治・法律', labelEn: 'Political / Legal',
  desc: '政策・規制・法改正・税制・補助金など',
  header: '#2563eb', bg: '#eff6ff', chip: '#bfdbfe', chipFg: '#1e3a8a', divider: '#93c5fd',
}
const Q_ECONOMIC: QuadrantDef = {
  role: 'economic', letter: 'E', label: '経済', labelEn: 'Economic',
  desc: '景気・為替・金利・物価・消費動向など',
  header: '#16a34a', bg: '#f0fdf4', chip: '#bbf7d0', chipFg: '#14532d', divider: '#86efac',
}
const Q_SOCIAL: QuadrantDef = {
  role: 'social', letter: 'S', label: '社会・文化', labelEn: 'Social / Cultural',
  desc: '人口動態・ライフスタイル・価値観・トレンドなど',
  header: '#d97706', bg: '#fffbeb', chip: '#fde68a', chipFg: '#78350f', divider: '#fcd34d',
}
const Q_TECH: QuadrantDef = {
  role: 'technological', letter: 'T', label: '技術', labelEn: 'Technological',
  desc: 'AI・DX・IoT・自動化・イノベーションなど',
  header: '#7c3aed', bg: '#f5f3ff', chip: '#ddd6fe', chipFg: '#4c1d95', divider: '#c4b5fd',
}

// ── インライン編集チップ ───────────────────────────────────────────────────────
interface ChipProps {
  node:        StructuredNode
  q:           QuadrantDef
  onEdit?:     (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}
function NodeChip({ node, q, onEdit, onDragStart }: ChipProps) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(node.label)
  useEffect(() => setValue(node.label), [node.label])
  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== node.label) onEdit?.(node.id, t)
    else setValue(node.label)
  }
  return (
    <div
      draggable={!editing}
      onDragStart={e => { if (!editing) onDragStart(e, node.id) }}
      style={{
        background: q.chip, color: q.chipFg, borderRadius: 7,
        padding: '7px 11px', fontSize: 12.5, fontWeight: 500, lineHeight: 1.55,
        cursor: 'grab', wordBreak: 'break-word', userSelect: 'none',
        boxShadow: `0 1px 3px ${q.header}18`,
      }}
      onDoubleClick={() => { setEditing(true); setValue(node.label) }}
      title="ダブルクリックで編集 / ドラッグで移動"
    >
      {editing ? (
        <textarea autoFocus value={value} rows={2}
          style={{ width: '100%', resize: 'none', background: 'transparent',
            border: 'none', outline: 'none', color: 'inherit', fontWeight: 500,
            fontSize: 12.5, lineHeight: '1.55', fontFamily: 'inherit', padding: 0 }}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setEditing(false); setValue(node.label) }
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : node.label}
    </div>
  )
}

// ── 象限カード ────────────────────────────────────────────────────────────────
interface QuadrantCardProps {
  q:           QuadrantDef
  nodes:       StructuredNode[]
  onEdit?:     (id: string, label: string) => void
  onMove:      (nodeId: string, role: NodeRole) => void
  cardRef?:    React.RefObject<HTMLDivElement | null>
  horizontal?: boolean  // true → T/E サイドボックス（高さ合わせが不要）
}
function QuadrantCard({ q, nodes, onEdit, onMove, cardRef, horizontal }: QuadrantCardProps) {
  const [dragOver, setDragOver] = useState(false)
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const id = e.dataTransfer.getData('text/plain')
    if (id) onMove(id, q.role)
  }
  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        display: 'flex', flexDirection: 'column',
        background: dragOver ? q.chip : q.bg,
        border: `2px solid ${dragOver ? q.header : q.divider}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: dragOver ? `0 0 0 4px ${q.header}28` : '0 2px 8px rgba(0,0,0,0.07)',
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        minHeight: horizontal ? 0 : 120,
      }}
    >
      {/* ヘッダー */}
      <div style={{
        background: q.header, color: '#fff',
        padding: '10px 14px 9px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, flexShrink: 0,
        }}>
          {q.letter}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{q.label}</div>
          <div style={{ fontSize: 10.5, opacity: 0.80, marginTop: 2 }}>{q.labelEn}</div>
        </div>
        {nodes.length > 0 && (
          <div style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.22)',
            borderRadius: 10, padding: '1px 8px', fontSize: 12, fontWeight: 700,
          }}>
            {nodes.length}件
          </div>
        )}
      </div>
      {/* 説明帯 */}
      <div style={{
        background: q.chip, color: q.chipFg, fontSize: 10.5,
        padding: '5px 12px', lineHeight: 1.5,
        borderBottom: `1px solid ${q.divider}`,
      }}>
        {q.desc}
      </div>
      {/* チップエリア */}
      <div style={{
        padding: '10px 12px', flex: 1,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {nodes.length === 0 ? (
          <div style={{
            fontSize: 11, color: q.header, opacity: 0.3,
            fontStyle: 'italic', textAlign: 'center', paddingTop: 12,
          }}>
            ここにドロップ
          </div>
        ) : nodes.map(n => (
          <NodeChip key={n.id} node={n} q={q} onEdit={onEdit} onDragStart={handleDragStart} />
        ))}
      </div>
    </div>
  )
}

// ── 矢印座標 ──────────────────────────────────────────────────────────────────
interface ArrowLine { x1: number; y1: number; x2: number; y2: number }

function toLocal(r: DOMRect, ox: number, oy: number) {
  return {
    cx: r.left + r.width  / 2 - ox,
    cy: r.top  + r.height / 2 - oy,
    t:  r.top    - oy,
    b:  r.bottom - oy,
    l:  r.left   - ox,
    r:  r.right  - ox,
  }
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface PESTCanvasProps {
  graph:       FrameworkGraph
  onNodeEdit?: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function PESTCanvas({ graph, onNodeEdit }: PESTCanvasProps) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const pRef     = useRef<HTMLDivElement>(null)
  const eRef     = useRef<HTMLDivElement>(null)
  const sRef     = useRef<HTMLDivElement>(null)
  const tRef     = useRef<HTMLDivElement>(null)
  const ovalRef  = useRef<HTMLDivElement>(null)

  const [arrows, setArrows] = useState<ArrowLine[]>([])
  const [svgW,   setSvgW]   = useState(0)
  const [svgH,   setSvgH]   = useState(0)

  const measure = () => {
    const wrap = wrapRef.current
    const oval = ovalRef.current
    if (!wrap || !oval) return
    const wR = wrap.getBoundingClientRect()
    const oR = oval.getBoundingClientRect()
    const pr = pRef.current?.getBoundingClientRect()
    const er = eRef.current?.getBoundingClientRect()
    const sr = sRef.current?.getBoundingClientRect()
    const tr = tRef.current?.getBoundingClientRect()
    if (!pr || !er || !sr || !tr) return

    const ox = wR.left, oy = wR.top
    const o = toLocal(oR, ox, oy)
    const p = toLocal(pr, ox, oy)
    const e = toLocal(er, ox, oy)
    const s = toLocal(sr, ox, oy)
    const t = toLocal(tr, ox, oy)

    setSvgW(wR.width)
    setSvgH(wR.height)
    setArrows([
      { x1: p.cx, y1: p.b,  x2: o.cx, y2: o.t  }, // P → center (↓)
      { x1: e.l,  y1: e.cy, x2: o.r,  y2: o.cy  }, // E → center (←)
      { x1: s.cx, y1: s.t,  x2: o.cx, y2: o.b   }, // S → center (↑)
      { x1: t.r,  y1: t.cy, x2: o.l,  y2: o.cy  }, // T → center (→)
    ])
  }

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    ;[wrapRef, pRef, eRef, sRef, tRef, ovalRef].forEach(
      r => { if (r.current) ro.observe(r.current) }
    )
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.nodes])

  const grouped = useMemo(() => {
    const m = new Map<NodeRole, StructuredNode[]>([
      ['political', []], ['economic', []], ['social', []], ['technological', []],
    ])
    graph.nodes.forEach(n => m.get(n.role as NodeRole)?.push(n))
    return m
  }, [graph.nodes])

  const moveNode  = (id: string, role: NodeRole) => onNodeEdit?.(id, { role })
  const editLabel = (id: string, label: string)  => onNodeEdit?.(id, { label })

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto', background: '#f5f8fc',
      padding: '24px 24px 48px', boxSizing: 'border-box',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* PEST タイトルバー */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', borderRadius: 10,
            overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
          }}>
            {[Q_POLITICAL, Q_ECONOMIC, Q_SOCIAL, Q_TECH].map(q => (
              <div key={q.letter} style={{
                background: q.header, color: '#fff',
                padding: '6px 20px', fontSize: 20, fontWeight: 900, letterSpacing: '0.04em',
              }}>
                {q.letter}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            マクロ環境分析 — チップをドラッグして象限を移動できます
          </div>
        </div>

        {/* ── ハブ＆スポーク レイアウト ─────────────────────────── */}
        <div
          ref={wrapRef}
          style={{ position: 'relative' }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 220px',
            gridTemplateRows: 'auto auto auto',
            gap: 20,
            alignItems: 'center',
          }}>

            {/* 行1: [空] [P] [空] */}
            <div />
            <div ref={pRef}>
              <QuadrantCard q={Q_POLITICAL} nodes={grouped.get('political') ?? []}
                onEdit={editLabel} onMove={moveNode} />
            </div>
            <div />

            {/* 行2: [T] [center oval] [E] */}
            <div ref={tRef}>
              <QuadrantCard q={Q_TECH} nodes={grouped.get('technological') ?? []}
                onEdit={editLabel} onMove={moveNode} horizontal />
            </div>

            {/* 中央オーバル */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <div
                ref={ovalRef}
                style={{
                  background: '#fff',
                  border: '2.5px solid #64748b',
                  borderRadius: '50%',
                  width: 106, height: 72,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', fontWeight: 800, fontSize: 15, color: '#334155',
                  boxShadow: '0 2px 14px rgba(0,0,0,0.12)',
                  lineHeight: 1.35,
                  letterSpacing: '0.02em',
                }}
              >
                業界<br />環境
              </div>
            </div>

            <div ref={eRef}>
              <QuadrantCard q={Q_ECONOMIC} nodes={grouped.get('economic') ?? []}
                onEdit={editLabel} onMove={moveNode} horizontal />
            </div>

            {/* 行3: [空] [S] [空] */}
            <div />
            <div ref={sRef}>
              <QuadrantCard q={Q_SOCIAL} nodes={grouped.get('social') ?? []}
                onEdit={editLabel} onMove={moveNode} />
            </div>
            <div />

          </div>

          {/* ── SVG 矢印オーバーレイ ─────────────────────────── */}
          {svgW > 0 && (
            <svg
              style={{
                position: 'absolute', top: 0, left: 0,
                width: svgW, height: svgH,
                pointerEvents: 'none', overflow: 'visible',
              }}
              aria-hidden
            >
              <defs>
                <marker
                  id="pest-ah" markerWidth="9" markerHeight="7"
                  refX="8" refY="3.5" orient="auto"
                >
                  <polygon points="0 0,9 3.5,0 7" fill="#64748b" />
                </marker>
              </defs>
              {arrows.map((a, i) => (
                <line
                  key={i}
                  x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                  stroke="#64748b" strokeWidth={2.5}
                  strokeDasharray="5 4"
                  markerEnd="url(#pest-ah)"
                />
              ))}
            </svg>
          )}
        </div>

      </div>
    </div>
  )
}
