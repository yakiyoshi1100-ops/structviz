import { useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

const CATEGORIES: Array<{
  role: NodeRole
  labelEn: string
  labelJa: string
  desc: string
}> = [
  {
    role: 'abc_high',
    labelEn: 'A — 重要度高',
    labelJa: '重要度高',
    desc: '上位20%・\n最優先管理',
  },
  {
    role: 'abc_mid',
    labelEn: 'B — 重要度中',
    labelJa: '重要度中',
    desc: '中位30%・\n定期管理',
  },
  {
    role: 'abc_low',
    labelEn: 'C — 重要度低',
    labelJa: '重要度低',
    desc: '下位50%・\n簡易管理',
  },
]

const CATEGORY_COLORS = [
  {
    // A — Amber
    header:  '#d97706',
    descBg:  '#fef3c7',
    descFg:  '#78350f',
    colBg:   '#fffbeb',
    chipBg:  '#fde68a',
    chipFg:  '#78350f',
    divider: '#fcd34d',
  },
  {
    // B — Blue
    header:  '#2563eb',
    descBg:  '#dbeafe',
    descFg:  '#1e3a8a',
    colBg:   '#eff6ff',
    chipBg:  '#bfdbfe',
    chipFg:  '#1e3a8a',
    divider: '#93c5fd',
  },
  {
    // C — Slate
    header:  '#64748b',
    descBg:  '#f1f5f9',
    descFg:  '#1e293b',
    colBg:   '#f8fafc',
    chipBg:  '#e2e8f0',
    chipFg:  '#1e293b',
    divider: '#cbd5e1',
  },
] as const

const ARROW_PX = 22

function chevronClip(index: number, total: number): string {
  const a = ARROW_PX
  if (index === 0)
    return `polygon(0 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, 0 100%)`
  if (index === total - 1)
    return `polygon(${a}px 0, 100% 0, 100% 100%, ${a}px 100%, 0 50%)`
  return `polygon(${a}px 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, ${a}px 100%, 0 50%)`
}

function chevronPadding(index: number, total: number, base = 12) {
  const a = ARROW_PX + base
  return {
    paddingLeft:  index === 0         ? base : a,
    paddingRight: index === total - 1 ? base : a,
  }
}

function ItemChip({
  node,
  colorIdx,
  onEdit,
}: {
  node: StructuredNode
  colorIdx: number
  onEdit: (id: string, label: string) => void
}) {
  const c = CATEGORY_COLORS[colorIdx]
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.label)

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== node.label) onEdit(node.id, t)
    else setValue(node.label)
  }

  return (
    <div
      onDoubleClick={() => { setEditing(true); setValue(node.label) }}
      title="ダブルクリックで編集"
      style={{
        background:   c.chipBg,
        color:        c.chipFg,
        padding:      '8px 12px',
        borderRadius: 7,
        fontSize:     12,
        fontWeight:   500,
        lineHeight:   1.5,
        wordBreak:    'break-word',
        boxShadow:    `0 1px 3px ${c.header}20`,
        cursor:       'default',
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={value}
          style={{
            width:      '100%',
            border:     'none',
            background: 'transparent',
            outline:    'none',
            color:      'inherit',
            font:       'inherit',
            padding:    0,
          }}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setValue(node.label); setEditing(false) }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

interface ABCCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function ABCCanvas({ graph, onNodeEdit }: ABCCanvasProps) {
  const grouped = useMemo<Map<NodeRole, StructuredNode[]>>(() => {
    const m = new Map<NodeRole, StructuredNode[]>(
      CATEGORIES.map(c => [c.role, []])
    )
    graph.nodes.forEach(n => {
      m.get(n.role as NodeRole)?.push(n)
    })
    return m
  }, [graph])

  const total = CATEGORIES.length

  const handleEdit = (nodeId: string, label: string) => {
    onNodeEdit(nodeId, { label })
  }

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        overflow:   'auto',
        padding:    '28px 24px 40px',
        boxSizing:  'border-box',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        background: '#f5f8fc',
      }}
    >
      <div style={{ minWidth: 480 }}>

        <h2
          style={{
            margin:        '0 0 16px',
            fontSize:      17,
            fontWeight:    800,
            color:         '#0f172a',
            textAlign:     'center',
            letterSpacing: '-0.01em',
          }}
        >
          ABC分析 — 重要度による分類
        </h2>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {CATEGORIES.map((cat, i) => {
            const c = CATEGORY_COLORS[i]
            return (
              <div
                key={cat.role}
                style={{
                  background: c.header,
                  color:      '#fff',
                  clipPath:   chevronClip(i, total),
                  ...chevronPadding(i, total),
                  paddingTop:    14,
                  paddingBottom: 14,
                  textAlign:     'center',
                  fontWeight:    700,
                  fontSize:      13,
                  lineHeight:    1.35,
                  letterSpacing: '0.02em',
                }}
              >
                {cat.labelEn}
                <br />
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.88 }}>
                  {cat.labelJa}
                </span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {CATEGORIES.map((cat, i) => {
            const c = CATEGORY_COLORS[i]
            return (
              <div
                key={cat.role}
                style={{
                  background:  c.descBg,
                  padding:     '10px 14px 12px',
                  fontSize:    11,
                  color:       c.descFg,
                  textAlign:   'center',
                  lineHeight:  1.55,
                  whiteSpace:  'pre-line',
                  borderRight: i < total - 1 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                {cat.desc}
              </div>
            )
          })}
        </div>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
            alignItems:          'start',
          }}
        >
          {CATEGORIES.map((cat, i) => {
            const c     = CATEGORY_COLORS[i]
            const nodes = grouped.get(cat.role) ?? []
            return (
              <div
                key={cat.role}
                style={{
                  background:    c.colBg,
                  padding:       '16px 12px',
                  minHeight:     140,
                  borderRight:   i < total - 1 ? `1px solid ${c.divider}` : 'none',
                  borderTop:     `2px solid ${c.divider}`,
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           8,
                }}
              >
                {nodes.length === 0 ? (
                  <span
                    style={{
                      fontSize:  11,
                      color:     c.descFg,
                      opacity:   0.4,
                      fontStyle: 'italic',
                      textAlign: 'center',
                      marginTop: 16,
                    }}
                  >
                    —
                  </span>
                ) : (
                  nodes.map(node => (
                    <ItemChip
                      key={node.id}
                      node={node}
                      colorIdx={i}
                      onEdit={handleEdit}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>

        <p style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          チップをダブルクリックして編集できます
        </p>

      </div>
    </div>
  )
}
