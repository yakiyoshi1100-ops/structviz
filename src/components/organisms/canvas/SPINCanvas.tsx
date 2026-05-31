import { useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

const CATEGORIES: Array<{
  role: NodeRole
  labelEn: string
  labelJa: string
  desc: string
}> = [
  {
    role: 'spin_situation',
    labelEn: 'Situation',
    labelJa: '状況',
    desc: '現状・背景・\n事実の確認',
  },
  {
    role: 'spin_problem',
    labelEn: 'Problem',
    labelJa: '問題',
    desc: '課題・困りごと・\n不満の把握',
  },
  {
    role: 'spin_implication',
    labelEn: 'Implication',
    labelJa: '示唆',
    desc: '放置した場合の\n影響・リスク',
  },
  {
    role: 'spin_need',
    labelEn: 'Need-payoff',
    labelJa: '解決',
    desc: '解決策の\n価値・メリット',
  },
]

const CATEGORY_COLORS = [
  {
    // Situation — Blue
    header:  '#2563eb',
    descBg:  '#dbeafe',
    descFg:  '#1e3a8a',
    colBg:   '#eff6ff',
    chipBg:  '#bfdbfe',
    chipFg:  '#1e3a8a',
    divider: '#93c5fd',
  },
  {
    // Problem — Orange
    header:  '#ea580c',
    descBg:  '#ffedd5',
    descFg:  '#7c2d12',
    colBg:   '#fff7ed',
    chipBg:  '#fed7aa',
    chipFg:  '#7c2d12',
    divider: '#fdba74',
  },
  {
    // Implication — Red
    header:  '#dc2626',
    descBg:  '#fee2e2',
    descFg:  '#7f1d1d',
    colBg:   '#fef2f2',
    chipBg:  '#fecaca',
    chipFg:  '#7f1d1d',
    divider: '#fca5a5',
  },
  {
    // Need-payoff — Green
    header:  '#16a34a',
    descBg:  '#dcfce7',
    descFg:  '#14532d',
    colBg:   '#f0fdf4',
    chipBg:  '#bbf7d0',
    chipFg:  '#14532d',
    divider: '#86efac',
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

interface SPINCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function SPINCanvas({ graph, onNodeEdit }: SPINCanvasProps) {
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
      <div style={{ minWidth: 600 }}>

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
          SPIN話法 — ニーズを引き出す4ステップ
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
