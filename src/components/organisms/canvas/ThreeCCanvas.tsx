import { useMemo, useEffect, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// 3C分析 ベン図キャンバス
// ──────────────────────────────────────────────────────────────────────────────
// 7ゾーン構成（ベン図の各領域に対応）:
//
//             ┌──────────────────┐
//             │   市場・顧客のみ  │
//  ┌─────────┬┴──────────────────┬┴────────────┐
//  │ 狙うべき │   差別化の核      │ レッドオーシャン│
//  │ポジション│                  │             │
//  ├─────────┼───────────────────┼─────────────┤
//  │ 自社のみ │   自社×競合       │  競合のみ    │
//  └─────────┴───────────────────┴─────────────┘
//
// - ノードはドラッグ&ドロップでゾーン間を移動可能
// - AIは初期値として customer/competitor/company を付与
// - ユーザーが分析しながら交差ゾーンへ移動させる
// ══════════════════════════════════════════════════════════════════════════════

// ── ゾーン定義 ──────────────────────────────────────────────────────────────
interface ZoneDef {
  role:       NodeRole
  label:      string
  desc:       string
  bg:         string
  chip:       string
  chipFg:     string
  border:     string
  header:     string
  // CSS grid-area (row-start / col-start / row-end / col-end) — 1-indexed
  gridRow:    string
  gridCol:    string
}

const ZONES: ZoneDef[] = [
  // ── 行1（中央：顧客のみ） ──────────────────────────────────────────────────
  {
    role:    'customer',
    label:   '市場・顧客のみ',
    desc:    '顧客ニーズ・市場特性（自社・競合との重なりなし）',
    bg:      '#e0f7f5',
    chip:    '#99f6e4',
    chipFg:  '#134e4a',
    border:  '#2dd4bf',
    header:  '#0f766e',
    gridRow: '1',
    gridCol: '2',
  },
  // ── 行2（左：顧客×自社、中：核、右：顧客×競合） ─────────────────────────
  {
    role:    'three_c_target',
    label:   '狙うべきポジション',
    desc:    '顧客ニーズ × 自社強み（競合が未対応）',
    bg:      '#fef9c3',
    chip:    '#fde68a',
    chipFg:  '#78350f',
    border:  '#fbbf24',
    header:  '#92400e',
    gridRow: '2',
    gridCol: '1',
  },
  {
    role:    'three_c_core',
    label:   '差別化の核',
    desc:    '顧客・自社・競合 の三者が重なる領域',
    bg:      '#dcfce7',
    chip:    '#bbf7d0',
    chipFg:  '#14532d',
    border:  '#4ade80',
    header:  '#15803d',
    gridRow: '2',
    gridCol: '2',
  },
  {
    role:    'three_c_red_ocean',
    label:   'レッドオーシャン',
    desc:    '顧客ニーズ × 競合強み（自社が未対応）',
    bg:      '#fee2e2',
    chip:    '#fca5a5',
    chipFg:  '#7f1d1d',
    border:  '#f87171',
    header:  '#b91c1c',
    gridRow: '2',
    gridCol: '3',
  },
  // ── 行3（左：自社のみ、中：自社×競合、右：競合のみ） ────────────────────
  {
    role:    'company',
    label:   '自社のみ',
    desc:    '自社の強み・特性（顧客ニーズ・競合との重なりなし）',
    bg:      '#fffbeb',
    chip:    '#fef08a',
    chipFg:  '#78350f',
    border:  '#fbbf24',
    header:  '#92400e',
    gridRow: '3',
    gridCol: '1',
  },
  {
    role:    'three_c_comp_adv',
    label:   '競合優位エリア',
    desc:    '自社 × 競合（顧客ニーズとの重なりなし）',
    bg:      '#ede9fe',
    chip:    '#ddd6fe',
    chipFg:  '#4c1d95',
    border:  '#a78bfa',
    header:  '#6d28d9',
    gridRow: '3',
    gridCol: '2',
  },
  {
    role:    'competitor',
    label:   '競合のみ',
    desc:    '競合の強み・特性（顧客ニーズ・自社との重なりなし）',
    bg:      '#fce7f3',
    chip:    '#fbcfe8',
    chipFg:  '#831843',
    border:  '#f472b6',
    header:  '#9d174d',
    gridRow: '3',
    gridCol: '3',
  },
]

const ZONE_MAP = new Map(ZONES.map(z => [z.role, z]))

// ── インライン編集チップ ───────────────────────────────────────────────────────
interface ChipProps {
  node:    StructuredNode
  zone:    ZoneDef
  onEdit?: (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}

function NodeChip({ node, zone, onEdit, onDragStart }: ChipProps) {
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
        background:   zone.chip,
        color:        zone.chipFg,
        borderRadius: 6,
        padding:      '7px 11px',
        fontSize:     12,
        fontWeight:   500,
        lineHeight:   1.5,
        marginBottom: 5,
        cursor:       'grab',
        wordBreak:    'break-word',
        boxShadow:    '0 1px 3px rgba(0,0,0,0.08)',
        userSelect:   'none',
      }}
      onDoubleClick={() => { setEditing(true); setValue(node.label) }}
      title="ダブルクリックで編集 / ドラッグで他のゾーンへ移動"
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
            fontWeight: 500,
            fontSize:   12,
            lineHeight: '1.5',
            fontFamily: 'inherit',
            padding:    0,
            cursor:     'text',
          }}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setEditing(false); setValue(node.label) }
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

// ── ゾーンカード ──────────────────────────────────────────────────────────────
interface ZoneCardProps {
  zone:     ZoneDef
  nodes:    StructuredNode[]
  onEdit?:  (id: string, label: string) => void
  onMove:   (nodeId: string, role: NodeRole) => void
}

function ZoneCard({ zone, nodes, onEdit, onMove }: ZoneCardProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const nodeId = e.dataTransfer.getData('text/plain')
    if (nodeId) onMove(nodeId, zone.role)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background:   dragOver ? zone.chip : zone.bg,
        borderRadius: 10,
        border:       `2px solid ${dragOver ? zone.border : zone.border + '80'}`,
        padding:      '10px 12px 8px',
        minHeight:    90,
        boxSizing:    'border-box',
        transition:   'background 0.15s, border-color 0.15s',
        boxShadow:    dragOver ? `0 0 0 3px ${zone.border}40` : '0 1px 4px rgba(0,0,0,0.06)',
        display:      'flex',
        flexDirection: 'column',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          fontWeight:   700,
          fontSize:     12,
          color:        zone.header,
          marginBottom: 6,
          lineHeight:   1.3,
          letterSpacing: '0.01em',
        }}
      >
        {zone.label}
        {nodes.length > 0 && (
          <span
            style={{
              marginLeft:   6,
              background:   zone.border,
              color:        '#fff',
              borderRadius: 10,
              padding:      '0 6px',
              fontSize:     10,
              fontWeight:   700,
              lineHeight:   '16px',
              display:      'inline-block',
              verticalAlign: 'middle',
            }}
          >
            {nodes.length}
          </span>
        )}
      </div>
      {/* 説明文 */}
      <div
        style={{
          fontSize:     10,
          color:        zone.header,
          opacity:      0.65,
          marginBottom: 8,
          lineHeight:   1.4,
        }}
      >
        {zone.desc}
      </div>
      {/* ノードチップ */}
      <div style={{ flex: 1 }}>
        {nodes.length === 0 ? (
          <div
            style={{
              fontSize:   11,
              color:      zone.header,
              opacity:    0.35,
              fontStyle:  'italic',
              textAlign:  'center',
              paddingTop: 8,
            }}
          >
            ここにドロップ
          </div>
        ) : (
          nodes.map(n => (
            <NodeChip
              key={n.id}
              node={n}
              zone={zone}
              onEdit={onEdit}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface ThreeCCanvasProps {
  graph:       FrameworkGraph
  onNodeEdit?: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function ThreeCCanvas({ graph, onNodeEdit }: ThreeCCanvasProps) {
  // ゾーン別にノードをグループ化
  const grouped = useMemo(() => {
    const m = new Map<NodeRole, StructuredNode[]>(
      ZONES.map(z => [z.role, []])
    )
    graph.nodes.forEach(n => {
      const list = m.get(n.role as NodeRole)
      if (list) list.push(n)
      // 不明ロールは customer に入れる
      else m.get('customer')?.push(n)
    })
    return m
  }, [graph.nodes])

  // ゾーンごとのカウント（バッジ表示用）
  const counts = useMemo(() => {
    const m = new Map<NodeRole, number>()
    ZONES.forEach(z => m.set(z.role, grouped.get(z.role)?.length ?? 0))
    return m
  }, [grouped])

  const moveNode = (nodeId: string, role: NodeRole) => {
    onNodeEdit?.(nodeId, { role })
  }

  const editLabel = (id: string, label: string) => {
    onNodeEdit?.(id, { label })
  }

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        overflow:   'auto',
        background: '#f5f8fc',
        padding:    '20px 20px 40px',
        boxSizing:  'border-box',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* ── ① ベン図（SVG）＋カウントバッジ ─────────────────────────────── */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <svg
            viewBox="0 0 700 460"
            style={{ width: '100%', display: 'block' }}
            aria-label="3C分析 ベン図"
          >
            <defs>
              <filter id="thr-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodOpacity="0.13" />
              </filter>
            </defs>

            {/* 3つの円 */}
            <circle cx={350} cy={185} r={162} fill="#7dd8d0" fillOpacity={0.30} stroke="#2dd4bf" strokeWidth={2} />
            <circle cx={210} cy={372} r={162} fill="#fde68a" fillOpacity={0.30} stroke="#fbbf24" strokeWidth={2} />
            <circle cx={490} cy={372} r={162} fill="#f9a8c9" fillOpacity={0.30} stroke="#f472b6" strokeWidth={2} />

            {/* 軸ラベル */}
            <text x={350} y={52} textAnchor="middle" fontSize={16} fontWeight={700} fill="#0f766e">市場・顧客</text>
            <text x={350} y={70} textAnchor="middle" fontSize={11} fill="#0f766e" opacity={0.75}>(Customer)</text>
            <text x={88}  y={448} textAnchor="middle" fontSize={16} fontWeight={700} fill="#92400e">自社</text>
            <text x={88}  y={465} textAnchor="middle" fontSize={11} fill="#92400e" opacity={0.75}>(Company)</text>
            <text x={612} y={448} textAnchor="middle" fontSize={16} fontWeight={700} fill="#9d174d">競合</text>
            <text x={612} y={465} textAnchor="middle" fontSize={11} fill="#9d174d" opacity={0.75}>(Competitor)</text>

            {/* ゾーンカウントバッジ */}
            {/* 顧客のみ（上） */}
            <CountBadge x={350} y={118} count={counts.get('customer') ?? 0} fill="#0f766e" />
            {/* 自社のみ（左下） */}
            <CountBadge x={120} y={430} count={counts.get('company') ?? 0} fill="#92400e" />
            {/* 競合のみ（右下） */}
            <CountBadge x={580} y={430} count={counts.get('competitor') ?? 0} fill="#9d174d" />

            {/* 交差インサイトラベル */}
            {/* 狙うべきポジション（左交差） */}
            <InsightLabel x={178} y={258} lines={['狙うべき', 'ポジション']} bg="#fef9c3" border="#fbbf24" fg="#78350f" count={counts.get('three_c_target') ?? 0} />
            {/* レッドオーシャン（右交差） */}
            <InsightLabel x={522} y={258} lines={['レッド', 'オーシャン']}  bg="#fee2e2" border="#f87171" fg="#7f1d1d" count={counts.get('three_c_red_ocean') ?? 0} />
            {/* 競合優位エリア（下交差） */}
            <InsightLabel x={350} y={428} lines={['競合優位', 'エリア']}    bg="#ede9fe" border="#a78bfa" fg="#4c1d95" count={counts.get('three_c_comp_adv') ?? 0} />
            {/* 差別化の核（中心） */}
            <InsightLabel x={350} y={305} lines={['差別化', 'の核']}        bg="#dcfce7" border="#4ade80" fg="#14532d" count={counts.get('three_c_core') ?? 0} />
          </svg>
        </div>

        {/* 操作ヒント */}
        <p
          style={{
            fontSize:   11,
            color:      '#64748b',
            textAlign:  'center',
            margin:     '0 0 16px',
          }}
        >
          💡 チップをドラッグして正しいゾーンへ移動させると、分析の気づきが深まります
        </p>

        {/* ── ② 7ゾーングリッド ─────────────────────────────────────────── */}
        {/*
          グリッド構成（ベン図の構造を反映）:
            行1 col2:    顧客のみ（広め）
            行2 col1:    狙うべきポジション
            行2 col2:    差別化の核
            行2 col3:    レッドオーシャン
            行3 col1:    自社のみ
            行3 col2:    競合優位エリア
            行3 col3:    競合のみ
        */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows:    'auto auto auto',
            gap:                 12,
          }}
        >
          {/* 行1: 顧客のみ（col 1-3 span） */}
          <div style={{ gridColumn: '1 / 4' }}>
            <ZoneCard
              zone={ZONES.find(z => z.role === 'customer')!}
              nodes={grouped.get('customer') ?? []}
              onEdit={onNodeEdit ? editLabel : undefined}
              onMove={moveNode}
            />
          </div>

          {/* 行2: 狙うべきポジション / 差別化の核 / レッドオーシャン */}
          {(['three_c_target', 'three_c_core', 'three_c_red_ocean'] as NodeRole[]).map(role => {
            const zone = ZONE_MAP.get(role)!
            return (
              <ZoneCard
                key={role}
                zone={zone}
                nodes={grouped.get(role) ?? []}
                onEdit={onNodeEdit ? editLabel : undefined}
                onMove={moveNode}
              />
            )
          })}

          {/* 行3: 自社のみ / 競合優位エリア / 競合のみ */}
          {(['company', 'three_c_comp_adv', 'competitor'] as NodeRole[]).map(role => {
            const zone = ZONE_MAP.get(role)!
            return (
              <ZoneCard
                key={role}
                zone={zone}
                nodes={grouped.get(role) ?? []}
                onEdit={onNodeEdit ? editLabel : undefined}
                onMove={moveNode}
              />
            )
          })}
        </div>

      </div>
    </div>
  )
}

// ── SVGヘルパー：カウントバッジ ───────────────────────────────────────────────
function CountBadge({ x, y, count, fill }: { x: number; y: number; count: number; fill: string }) {
  if (count === 0) return null
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill={fill} opacity={0.9} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
        {count}
      </text>
    </g>
  )
}

// ── SVGヘルパー：インサイトラベル ─────────────────────────────────────────────
function InsightLabel({
  x, y, lines, bg, border, fg, count,
}: {
  x: number; y: number; lines: string[]
  bg: string; border: string; fg: string; count: number
}) {
  const w = 102
  const h = 46
  return (
    <g filter="url(#thr-shadow)">
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={9} fill={bg} stroke={border} strokeWidth={1.5} />
      {lines.map((line, i) => (
        <text key={i} x={x} y={y - 4 + i * 16} textAnchor="middle" fontSize={11} fontWeight={700} fill={fg}>
          {line}
        </text>
      ))}
      {count > 0 && (
        <g>
          <circle cx={x + w / 2 - 8} cy={y - h / 2 - 2} r={9} fill={border} />
          <text x={x + w / 2 - 8} y={y - h / 2 + 2} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
            {count}
          </text>
        </g>
      )}
    </g>
  )
}
