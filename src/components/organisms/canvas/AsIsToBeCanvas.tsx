import { useState } from 'react'
import { type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// AsIsToBeCanvas
// ──────────────────────────────────────────────────────────────────────────────
//  レイアウト:
//    ┌─────────────┐  ┌─────────────┐
//    │   As-Is     │  │   To-Be     │
//    │  カード列   │  │  カード列   │
//    └─────────────┘  └─────────────┘
//          ↓                 ↑
//    ┌──────────────────────────────┐
//    │ [Gap ►]  カード  カード ...  │
//    └──────────────────────────────┘
//    ┌──────────────────────────────┐
//    │ [Action ►]  カード  カード   │
//    └──────────────────────────────┘
// ══════════════════════════════════════════════════════════════════════════════

interface AsIsToBeCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

// ── カラー定義 ────────────────────────────────────────────────────────────────
const SECTION = {
  as_is:  { label: 'As-Is',   sub: '現状',  headerBg: '#94a3b8', headerText: '#fff' },
  to_be:  { label: 'To-Be',   sub: '理想',  headerBg: '#3b82f6', headerText: '#fff' },
  gap:    { label: 'Gap',     sub: '差分',  color: '#f97316' },
  action: { label: 'Action',  sub: '打ち手', color: '#f59e0b' },
} as const

// ── ペンタゴン（右向き矢印バッジ）─────────────────────────────────────────────
function PentagonLabel({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth:   80,
        paddingRight: 16,           // 矢印の突起分オフセット
        clipPath:   'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
        background: color,
        color:      '#fff',
        paddingLeft: 16,
        gap:        2,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, letterSpacing: '0.04em' }}>{sub}</span>
    </div>
  )
}

// ── 単一カード ──────────────────────────────────────────────────────────────
function Card({
  node,
  editingId,
  editingValue,
  onStartEdit,
  onCommit,
  onChangeValue,
}: {
  node: StructuredNode
  editingId: string | null
  editingValue: string
  onStartEdit: (n: StructuredNode) => void
  onCommit: () => void
  onChangeValue: (v: string) => void
}) {
  return (
    <article
      className="sv-cell-card"
      draggable
      style={{ cursor: 'grab' }}
      onClick={() => onStartEdit(node)}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', node.id)}
    >
      {editingId === node.id ? (
        <input
          autoFocus
          value={editingValue}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none',
                   font: 'inherit', padding: 0 }}
          onBlur={onCommit}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit() }}
        />
      ) : (
        node.label
      )}
    </article>
  )
}

// ── DropZone BOX（As-Is / To-Be） ───────────────────────────────────────────
function TopBox({
  role,
  nodes,
  onDrop,
  editingId,
  editingValue,
  onStartEdit,
  onCommit,
  onChangeValue,
}: {
  role:   'as_is' | 'to_be'
  nodes:  StructuredNode[]
  onDrop: (nodeId: string, role: NodeRole) => void
  editingId: string | null
  editingValue: string
  onStartEdit: (n: StructuredNode) => void
  onCommit: () => void
  onChangeValue: (v: string) => void
}) {
  const cfg = SECTION[role]
  return (
    <div
      style={{
        flex:         '1 1 0',
        display:      'flex',
        flexDirection: 'column',
        border:       '1.5px solid #cbd5e1',
        borderRadius: 12,
        overflow:     'hidden',
        background:   '#fff',
        boxShadow:    '0 1px 6px rgba(0,0,0,0.07)',
        minHeight:    160,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id, role)
      }}
    >
      {/* ヘッダー */}
      <div style={{
        background: cfg.headerBg,
        color:      cfg.headerText,
        padding:    '10px 16px',
        display:    'flex',
        alignItems: 'baseline',
        gap:        8,
      }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{cfg.label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {cfg.sub}
        </span>
      </div>
      {/* ボディ */}
      <div style={{
        flex:           1,
        padding:        '10px 12px',
        display:        'flex',
        flexDirection:  'column',
        gap:            7,
        overflowY:      'auto',
      }}>
        {nodes.map((node) => (
          <Card
            key={node.id}
            node={node}
            editingId={editingId}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommit={onCommit}
            onChangeValue={onChangeValue}
          />
        ))}
      </div>
    </div>
  )
}

// ── 横帯 BOX（Gap / Action） ─────────────────────────────────────────────────
function BandBox({
  role,
  nodes,
  onDrop,
  editingId,
  editingValue,
  onStartEdit,
  onCommit,
  onChangeValue,
}: {
  role:   'gap' | 'action'
  nodes:  StructuredNode[]
  onDrop: (nodeId: string, role: NodeRole) => void
  editingId: string | null
  editingValue: string
  onStartEdit: (n: StructuredNode) => void
  onCommit: () => void
  onChangeValue: (v: string) => void
}) {
  const cfg = SECTION[role]
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'stretch',
        border:       '1.5px solid #e2e8f0',
        borderRadius: 12,
        overflow:     'hidden',
        background:   '#fff',
        boxShadow:    '0 1px 6px rgba(0,0,0,0.07)',
        minHeight:    72,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id, role)
      }}
    >
      {/* ペンタゴンラベル */}
      <PentagonLabel label={cfg.label} sub={cfg.sub} color={cfg.color} />

      {/* カード群 */}
      <div style={{
        flex:       1,
        padding:    '10px 12px',
        display:    'flex',
        flexWrap:   'wrap',
        gap:        8,
        alignContent: 'flex-start',
        alignItems: 'flex-start',
      }}>
        {nodes.map((node) => (
          <Card
            key={node.id}
            node={node}
            editingId={editingId}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommit={onCommit}
            onChangeValue={onChangeValue}
          />
        ))}
      </div>
    </div>
  )
}

// ── 矢印（下向き / 上向き） ──────────────────────────────────────────────────
function Arrow({ direction }: { direction: 'down' | 'up' }) {
  const d = direction === 'down'
    ? 'M12 2 L12 18 M6 12 L12 18 L18 12'   // ↓
    : 'M12 22 L12 6 M6 12 L12 6 L18 12'    // ↑
  return (
    <svg width={32} height={28} viewBox="0 0 24 24" fill="none"
      stroke="#1e293b" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export function AsIsToBeCanvas({ graph, onNodeEdit, onNodeMove }: AsIsToBeCanvasProps) {
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const nodesOf = (role: NodeRole) => graph.nodes.filter((n) => n.role === role)

  const startEdit = (node: StructuredNode) => {
    setEditingId(node.id)
    setEditingValue(node.label)
  }

  const commitEdit = () => {
    if (editingId && editingValue.trim()) onNodeEdit(editingId, { label: editingValue.trim() })
    setEditingId(null)
  }

  const moveToRole = (nodeId: string, role: NodeRole) => {
    onNodeEdit(nodeId, { role })
    onNodeMove(nodeId, { x: 0, y: 0 })
  }

  const cardProps = { editingId, editingValue, onStartEdit: startEdit, onCommit: commitEdit, onChangeValue: setEditingValue }

  return (
    <div style={{
      width:    '100%',
      height:   '100%',
      display:  'flex',
      flexDirection: 'column',
      gap:      0,
      padding:  '20px 24px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      background: 'var(--color-bg)',
    }}>

      {/* ── 上段: As-Is / To-Be ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, flex: '1 1 auto', minHeight: 160 }}>
        <TopBox role="as_is"  nodes={nodesOf('as_is')}  onDrop={moveToRole} {...cardProps} />
        <TopBox role="to_be"  nodes={nodesOf('to_be')}  onDrop={moveToRole} {...cardProps} />
      </div>

      {/* ── 矢印行 ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', padding: '6px 0', pointerEvents: 'none' }}>
        {/* As-Is 列の中心に ↓ */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Arrow direction="down" />
        </div>
        {/* ギャップ (20px) */}
        <div style={{ width: 20 }} />
        {/* To-Be 列の中心に ↑ */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Arrow direction="up" />
        </div>
      </div>

      {/* ── 下段帯: Gap ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BandBox role="gap"    nodes={nodesOf('gap')}    onDrop={moveToRole} {...cardProps} />
        <BandBox role="action" nodes={nodesOf('action')} onDrop={moveToRole} {...cardProps} />
      </div>

    </div>
  )
}
