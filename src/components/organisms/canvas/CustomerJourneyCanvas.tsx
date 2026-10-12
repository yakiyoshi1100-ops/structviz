import { useMemo } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ── フェーズ定義 ───────────────────────────────────────────────────────────────
const PHASES: Array<{
  role:  NodeRole
  label: string      // 2行ラベル（改行 \n）
  desc:  string      // フェーズ行の説明文
}> = [
  {
    role:  'cj_awareness',
    label: '課題\n興味関心',
    desc:  '気になること、\n困りごとがある',
  },
  {
    role:  'cj_consideration',
    label: '情報収集',
    desc:  '解決策を調べる',
  },
  {
    role:  'cj_purchase',
    label: '評価\n比較検討',
    desc:  '商品・サービスを\n吟味する',
  },
  {
    role:  'cj_retention',
    label: '購入',
    desc:  '購入を決断',
  },
  {
    role:  'cj_advocacy',
    label: '共有\n拡散',
    desc:  '使用感をシェア、\n知人におすすめする',
  },
]

// ── デザイン定数 ──────────────────────────────────────────────────────────────
const ARROW_PX = 22   // シェブロン矢印の深さ (px)

// フェーズごとのカラースキーム（顧客体験の流れを色の変化で表現）
const PHASE_COLORS = [
  {
    // 課題・興味関心 — Violet
    header:  '#7c3aed',
    descBg:  '#ede9fe',
    descFg:  '#4c1d95',
    colBg:   '#f5f3ff',
    chipBg:  '#ddd6fe',
    chipFg:  '#4c1d95',
    divider: '#c4b5fd',
  },
  {
    // 情報収集 — Blue
    header:  '#2563eb',
    descBg:  '#dbeafe',
    descFg:  '#1e3a8a',
    colBg:   '#eff6ff',
    chipBg:  '#bfdbfe',
    chipFg:  '#1e3a8a',
    divider: '#93c5fd',
  },
  {
    // 評価・比較検討 — Teal
    header:  '#0d9488',
    descBg:  '#ccfbf1',
    descFg:  '#134e4a',
    colBg:   '#f0fdfa',
    chipBg:  '#99f6e4',
    chipFg:  '#134e4a',
    divider: '#5eead4',
  },
  {
    // 購入 — Emerald
    header:  '#16a34a',
    descBg:  '#dcfce7',
    descFg:  '#14532d',
    colBg:   '#f0fdf4',
    chipBg:  '#bbf7d0',
    chipFg:  '#14532d',
    divider: '#86efac',
  },
  {
    // 共有・拡散 — Amber
    header:  '#d97706',
    descBg:  '#fef3c7',
    descFg:  '#78350f',
    colBg:   '#fffbeb',
    chipBg:  '#fde68a',
    chipFg:  '#78350f',
    divider: '#fcd34d',
  },
] as const

// ── clip-path ヘルパー ─────────────────────────────────────────────────────────
function chevronClip(index: number, total: number): string {
  const a = ARROW_PX
  if (index === 0)
    return `polygon(0 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, 0 100%)`
  if (index === total - 1)
    return `polygon(${a}px 0, 100% 0, 100% 100%, ${a}px 100%, 0 50%)`
  return `polygon(${a}px 0, calc(100% - ${a}px) 0, 100% 50%, calc(100% - ${a}px) 100%, ${a}px 100%, 0 50%)`
}

// テキストが矢印で欠けないよう左右パディングを調整
function chevronPadding(index: number, total: number, base = 12) {
  const a = ARROW_PX + base
  const pl = index === 0 ? base : a
  const pr = index === total - 1 ? base : a
  return { paddingLeft: pl, paddingRight: pr }
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface CustomerJourneyCanvasProps {
  graph: FrameworkGraph
}

export function CustomerJourneyCanvas({ graph }: CustomerJourneyCanvasProps) {
  // フェーズごとにノードをグループ化
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
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '28px 24px 40px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        background: '#f5f8fc',
      }}
    >
      <div style={{ minWidth: 680 }}>

        {/* ── ① シェブロン型フェーズヘッダー ───────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {PHASES.map((ph, i) => {
            const c = PHASE_COLORS[i % PHASE_COLORS.length]
            return (
              <div
                key={ph.role}
                style={{
                  background: c.header,
                  color: '#fff',
                  clipPath: chevronClip(i, total),
                  ...chevronPadding(i, total),
                  paddingTop: 14,
                  paddingBottom: 14,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.4,
                  letterSpacing: '0.02em',
                  whiteSpace: 'pre-line',
                }}
              >
                {ph.label}
              </div>
            )
          })}
        </div>

        {/* ── ② フェーズ説明帯 ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {PHASES.map((ph, i) => {
            const c = PHASE_COLORS[i % PHASE_COLORS.length]
            return (
              <div
                key={ph.role}
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
                {ph.desc}
              </div>
            )
          })}
        </div>

        {/* ── ③ ノードチップエリア ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
            alignItems: 'start',
          }}
        >
          {PHASES.map((ph, i) => {
            const c     = PHASE_COLORS[i % PHASE_COLORS.length]
            const nodes = grouped.get(ph.role) ?? []
            return (
              <div
                key={ph.role}
                style={{
                  background:  c.colBg,
                  padding:     '16px 12px',
                  minHeight:   140,
                  borderRight: i < total - 1 ? `1px solid ${c.divider}` : 'none',
                  borderTop:   `2px solid ${c.divider}`,
                  display:     'flex',
                  flexDirection: 'column',
                  gap: 8,
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
                    <div
                      key={node.id}
                      style={{
                        background: c.chipBg,
                        color:      c.chipFg,
                        padding:    '8px 12px',
                        borderRadius: 7,
                        fontSize:   12,
                        fontWeight: 500,
                        lineHeight: 1.5,
                        wordBreak:  'break-word',
                        boxShadow:  `0 1px 3px ${c.header}20`,
                      }}
                    >
                      {node.label}
                    </div>
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
