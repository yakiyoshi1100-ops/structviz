import { useEffect, useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ── フェーズ定義 ───────────────────────────────────────────────────────────────
interface PhaseConfig {
  role:      NodeRole
  label:     string
  desc:      string
  headerBg:  string
  descBg:    string
  chipBg:    string
  chipFg:    string
}

const PHASES: PhaseConfig[] = [
  {
    role:     'phenomenon',
    label:    '現象',
    desc:     '表面に出ている\n困りごと・症状',
    headerBg: '#9f1239',
    descBg:   '#fff1f2',
    chipBg:   '#fce7f3',
    chipFg:   '#831843',
  },
  {
    role:     'problem',
    label:    '問題',
    desc:     '本当に困って\nいること（本質）',
    headerBg: '#c2410c',
    descBg:   '#fff7ed',
    chipBg:   '#ffedd5',
    chipFg:   '#7c2d12',
  },
  {
    role:     'cause',
    label:    '原因',
    desc:     '問題が起きている\n理由・要因',
    headerBg: '#a16207',
    descBg:   '#fefce8',
    chipBg:   '#fef9c3',
    chipFg:   '#713f12',
  },
  {
    role:     'issue',
    label:    '課題',
    desc:     '解決すべき\nテーマ・課題',
    headerBg: '#0f766e',
    descBg:   '#f0fdfa',
    chipBg:   '#ccfbf1',
    chipFg:   '#134e4a',
  },
  {
    role:     'measure',
    label:    '施策',
    desc:     '具体的な\n打ち手・アクション',
    headerBg: '#1d4ed8',
    descBg:   '#eff6ff',
    chipBg:   '#dbeafe',
    chipFg:   '#1e3a8a',
  },
]

// ── デザイン定数 ──────────────────────────────────────────────────────────────
const ARROW_PX = 22
const DIVIDER  = '1px solid rgba(0,0,0,0.08)'

// ── clip-path ヘルパー ────────────────────────────────────────────────────────
function chevronClip(index: number, total: number): string {
  const a = ARROW_PX
  if (index === 0)
    return `polygon(0 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, 0 100%)`
  if (index === total - 1)
    return `polygon(${a}px 0, 100% 0, 100% 100%, ${a}px 100%, 0 50%)`
  return `polygon(${a}px 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, ${a}px 100%, 0 50%)`
}

function chevronPadding(index: number, total: number, base = 10) {
  const a = ARROW_PX + base
  return {
    paddingLeft:  index === 0         ? base : a,
    paddingRight: index === total - 1 ? base : a,
  }
}

// ── 編集可能チップ ────────────────────────────────────────────────────────────
interface EditableChipProps {
  node:       StructuredNode
  ph:         PhaseConfig
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

function EditableChip({ node, ph, onNodeEdit }: EditableChipProps) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(node.label)

  useEffect(() => setValue(node.label), [node.label])

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== node.label) onNodeEdit(node.id, { label: t })
    else setValue(node.label)
  }

  return (
    <div
      style={{
        background:   ph.chipBg,
        color:        ph.chipFg,
        padding:      '8px 12px',
        borderRadius: 7,
        fontSize:     12,
        fontWeight:   500,
        lineHeight:   1.5,
        wordBreak:    'break-word',
        boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
        cursor:       'text',
        minHeight:    36,
      }}
      onDoubleClick={() => { setEditing(true); setValue(node.label) }}
      title="ダブルクリックで編集"
    >
      {editing ? (
        <textarea
          autoFocus
          value={value}
          rows={2}
          style={{
            width:      '100%',
            resize:     'none',
            background: 'transparent',
            border:     'none',
            outline:    'none',
            color:      'inherit',
            fontWeight: 'inherit',
            fontSize:   'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
            padding:    0,
            margin:     0,
          }}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setEditing(false); setValue(node.label) }
          }}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface PhenomenonToActionCanvasProps {
  graph:      FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function PhenomenonToActionCanvas({ graph, onNodeEdit }: PhenomenonToActionCanvasProps) {
  const grouped = useMemo<Map<NodeRole, StructuredNode[]>>(() => {
    const m = new Map<NodeRole, StructuredNode[]>(
      PHASES.map(p => [p.role, []])
    )
    graph.nodes.forEach(n => {
      m.get(n.role as NodeRole)?.push(n)
    })
    return m
  }, [graph])

  const total = PHASES.length

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        overflow:   'auto',
        padding:    '28px 24px 40px',
        boxSizing:  'border-box',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        background: '#f8fafc',
      }}
    >
      <div style={{ minWidth: 740 }}>

        {/* ── ① シェブロン型フェーズヘッダー ─────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap:                 0,
          }}
        >
          {PHASES.map((ph, i) => (
            <div
              key={ph.role}
              style={{
                background:    ph.headerBg,
                color:         '#fff',
                clipPath:      chevronClip(i, total),
                ...chevronPadding(i, total),
                paddingTop:    14,
                paddingBottom: 14,
                textAlign:     'center',
                fontWeight:    700,
                fontSize:      14,
                lineHeight:    1.4,
                letterSpacing: '0.04em',
              }}
            >
              {ph.label}
            </div>
          ))}
        </div>

        {/* ── ② フェーズ説明帯 ──────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap:                 0,
          }}
        >
          {PHASES.map((ph, i) => (
            <div
              key={ph.role}
              style={{
                background:  ph.descBg,
                padding:     '10px 14px',
                fontSize:    11,
                color:       ph.headerBg,
                textAlign:   'center',
                lineHeight:  1.55,
                whiteSpace:  'pre-line',
                fontWeight:  500,
                borderRight: i < total - 1 ? DIVIDER : 'none',
              }}
            >
              {ph.desc}
            </div>
          ))}
        </div>

        {/* ── ③ ノードチップエリア ───────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap:                 0,
            alignItems:          'start',
          }}
        >
          {PHASES.map((ph, i) => {
            const nodes = grouped.get(ph.role) ?? []
            return (
              <div
                key={ph.role}
                style={{
                  background:    '#fff',
                  padding:       '16px 12px',
                  minHeight:     140,
                  borderRight:   i < total - 1 ? DIVIDER : 'none',
                  borderTop:     DIVIDER,
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           8,
                }}
              >
                {nodes.length === 0 ? (
                  <span
                    style={{
                      fontSize:  11,
                      color:     '#cbd5e1',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      marginTop: 16,
                    }}
                  >
                    —
                  </span>
                ) : (
                  nodes.map(node => (
                    <EditableChip
                      key={node.id}
                      node={node}
                      ph={ph}
                      onNodeEdit={onNodeEdit}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
