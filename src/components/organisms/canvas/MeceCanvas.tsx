import { useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredEdge, StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// MECE ブロックモザイク
//
// 階層:
//   Root  … 全幅ダークヘッダー
//   Branch … 色分け等幅カラム
//   Leaf   … カラム内のグループカード
//   SubItem… Leaf 内に「・」区切りで並ぶ最小ブロック
//
// ラベルの書式:
//   "基本スペック（40名以上・年商10億円・天文館拠点）"
//    ↑ main          ↑ ・区切りで SubItem に分解
//
// 編集:
//   ・各テキストブロックをダブルクリック → インライン textarea
//   ・SubItem 編集時はラベルを再構築して保存
// ══════════════════════════════════════════════════════════════════════════════

// ── カラーパレット ─────────────────────────────────────────────────────────────
const PALETTE = [
  { main: '#2563eb', colBg: '#eff6ff', chipBg: '#bfdbfe', chipFg: '#1e3a8a', divider: '#93c5fd' },
  { main: '#0d9488', colBg: '#f0fdfa', chipBg: '#99f6e4', chipFg: '#134e4a', divider: '#5eead4' },
  { main: '#7c3aed', colBg: '#f5f3ff', chipBg: '#ddd6fe', chipFg: '#4c1d95', divider: '#c4b5fd' },
  { main: '#d97706', colBg: '#fffbeb', chipBg: '#fde68a', chipFg: '#78350f', divider: '#fcd34d' },
  { main: '#dc2626', colBg: '#fff1f2', chipBg: '#fecaca', chipFg: '#7f1d1d', divider: '#fca5a5' },
  { main: '#16a34a', colBg: '#f0fdf4', chipBg: '#bbf7d0', chipFg: '#14532d', divider: '#86efac' },
] as const
type Palette = typeof PALETTE[number]

// ── ラベル parse / reconstruct ─────────────────────────────────────────────
/**
 * "基本スペック（40名以上・年商10億円・天文館拠点）"
 * → { main: "基本スペック", items: ["40名以上", "年商10億円", "天文館拠点"] }
 *
 * 全角丸括弧と半角丸括弧の両方に対応。区切り文字は「・」「、」「,」。
 */
function parseLabel(label: string): { main: string; items: string[] } {
  const m = label.match(/^(.+?)[（(](.+)[）)]\s*$/)
  if (!m) return { main: label.trim(), items: [] }
  const items = m[2].split(/[・、,，]/).map(s => s.trim()).filter(Boolean)
  if (items.length <= 1) return { main: label.trim(), items: [] }
  return { main: m[1].trim(), items }
}

function reconstructLabel(main: string, items: string[]): string {
  return items.length === 0 ? main : `${main}（${items.join('・')}）`
}

// ── ノード役割判定 ─────────────────────────────────────────────────────────
type MeceTier = 'root' | 'branch' | 'leaf'

function classifyTier(role: NodeRole | string): MeceTier | null {
  if (role === 'unclassified') return null
  if (['root', 'theme', 'issue_root'].includes(role)) return 'root'
  if (['branch', 'category', 'segment'].includes(role)) return 'branch'
  return 'leaf'
}

function pickRoot(nodes: StructuredNode[], edges: StructuredEdge[]): StructuredNode | undefined {
  const explicit = nodes.find(n => classifyTier(n.role) === 'root')
  if (explicit) return explicit
  const targets = new Set(edges.map(e => e.target))
  return nodes.find(n => !targets.has(n.id)) ?? nodes[0]
}

function buildLeafParentMap(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
  branches: StructuredNode[],
): Map<string, string> {
  const map     = new Map<string, string>()
  const bIds    = new Set(branches.map(b => b.id))
  const epMap   = new Map(edges.map(e => [e.target, e.source]))
  let lastB: string | null = null
  let rr = 0
  nodes.forEach(n => {
    const t = classifyTier(n.role)
    if (t === 'branch') { lastB = n.id; return }
    if (t !== 'leaf') return
    const ep = epMap.get(n.id)
    if (ep && bIds.has(ep))       { map.set(n.id, ep);   return }
    if (n.parentId && bIds.has(n.parentId)) { map.set(n.id, n.parentId); return }
    if (lastB)                    { map.set(n.id, lastB); return }
    if (branches.length > 0)      { map.set(n.id, branches[rr++ % branches.length].id) }
  })
  return map
}

// ══════════════════════════════════════════════════════════════════════════════
// UI パーツ
// ══════════════════════════════════════════════════════════════════════════════

// ── インライン編集可能テキスト ────────────────────────────────────────────────
interface InlineEditProps {
  text:      string
  onSave:    (v: string) => void
  style?:    React.CSSProperties
  taStyle?:  React.CSSProperties
  rows?:     number
}
function InlineEdit({ text, onSave, style = {}, taStyle = {}, rows = 2 }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(text)

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== text) onSave(t)
    else setValue(text)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        rows={rows}
        style={{
          width: '100%', boxSizing: 'border-box',
          resize: 'none', background: 'transparent',
          border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 4,
          padding: '4px 6px', fontFamily: 'inherit',
          lineHeight: 1.5, outline: 'none', ...taStyle,
        }}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setEditing(false); setValue(text) }
        }}
      />
    )
  }

  return (
    <span
      style={{ cursor: 'default', display: 'block', ...style }}
      onDoubleClick={() => { setEditing(true); setValue(text) }}
      title="ダブルクリックで編集"
    >
      {text}
    </span>
  )
}

// ── SubItem ブロック（最小単位） ─────────────────────────────────────────────
interface SubItemProps {
  text:    string
  c:       Palette
  onSave:  (v: string) => void
}
function SubItem({ text, c, onSave }: SubItemProps) {
  return (
    <div
      style={{
        background:   c.chipBg,
        color:        c.chipFg,
        borderRadius: 6,
        padding:      '6px 10px',
        fontSize:     12,
        fontWeight:   500,
        lineHeight:   1.5,
        wordBreak:    'break-word',
        border:       `1px solid ${c.main}20`,
      }}
    >
      <InlineEdit
        text={text}
        onSave={onSave}
        style={{ fontSize: 12, fontWeight: 500, color: c.chipFg }}
        taStyle={{ color: c.chipFg, fontSize: 12, fontWeight: 500 }}
      />
    </div>
  )
}

// ── Leaf グループカード ───────────────────────────────────────────────────────
// parse 結果によって SubItem の有無が変わる。
interface LeafGroupProps {
  node:   StructuredNode
  c:      Palette
  onEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}
function LeafGroup({ node, c, onEdit }: LeafGroupProps) {
  const { main, items } = useMemo(() => parseLabel(node.label), [node.label])

  const saveMain = (newMain: string) =>
    onEdit(node.id, { label: reconstructLabel(newMain, items) })

  const saveItem = (idx: number, newVal: string) => {
    const newItems = items.map((it, i) => i === idx ? newVal : it)
    onEdit(node.id, { label: reconstructLabel(main, newItems) })
  }

  // SubItem なし → シンプルチップ
  if (items.length === 0) {
    return (
      <div
        style={{
          background:   c.chipBg,
          color:        c.chipFg,
          borderRadius: 7,
          padding:      '8px 12px',
          fontSize:     12,
          fontWeight:   500,
          lineHeight:   1.5,
          wordBreak:    'break-word',
          border:       `1px solid ${c.main}20`,
        }}
      >
        <InlineEdit
          text={main}
          onSave={saveMain}
          style={{ fontSize: 12, fontWeight: 500, color: c.chipFg }}
          taStyle={{ color: c.chipFg, fontSize: 12, fontWeight: 500 }}
        />
      </div>
    )
  }

  // SubItem あり → カードにまとめる
  return (
    <div
      style={{
        border:       `2px solid ${c.main}40`,
        borderRadius: 8,
        overflow:     'hidden',
        background:   '#ffffff',
        boxShadow:    `0 1px 6px ${c.main}18`,
      }}
    >
      {/* Leaf ラベル（グループ名） */}
      <div
        style={{
          background:   c.main + '14',   // 極薄メインカラー
          borderBottom: `1px solid ${c.main}30`,
          padding:      '5px 10px',
          fontSize:     11,
          fontWeight:   700,
          color:        c.chipFg,
          letterSpacing: '0.02em',
        }}
      >
        <InlineEdit
          text={main}
          onSave={saveMain}
          rows={1}
          style={{ fontSize: 11, fontWeight: 700, color: c.chipFg }}
          taStyle={{ color: c.chipFg, fontSize: 11, fontWeight: 700 }}
        />
      </div>

      {/* SubItem ブロック群 */}
      <div
        style={{
          padding:       '8px',
          display:       'flex',
          flexDirection: 'column',
          gap:           6,
        }}
      >
        {items.map((item, i) => (
          <SubItem
            key={i}
            text={item}
            c={c}
            onSave={v => saveItem(i, v)}
          />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// メインコンポーネント
// ══════════════════════════════════════════════════════════════════════════════
interface MeceCanvasProps {
  graph:      FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function MeceCanvas({ graph, onNodeEdit }: MeceCanvasProps) {
  const rootNode = useMemo(() => pickRoot(graph.nodes, graph.edges), [graph.nodes, graph.edges])

  const branches = useMemo(
    () => graph.nodes.filter(n => n.id !== rootNode?.id && classifyTier(n.role) === 'branch'),
    [graph.nodes, rootNode],
  )
  const leaves = useMemo(
    () => graph.nodes.filter(n => classifyTier(n.role) === 'leaf'),
    [graph.nodes],
  )
  const leafParentMap = useMemo(
    () => buildLeafParentMap(graph.nodes, graph.edges, branches),
    [graph.nodes, graph.edges, branches],
  )
  const leavesByBranch = useMemo(() => {
    const m = new Map<string, StructuredNode[]>(branches.map(b => [b.id, []]))
    leaves.forEach(lf => {
      const pid = leafParentMap.get(lf.id)
      if (pid) m.get(pid)?.push(lf)
    })
    return m
  }, [branches, leaves, leafParentMap])

  const totalCols = Math.max(branches.length, 1)

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        overflow:   'auto',
        padding:    '28px 24px 40px',
        boxSizing:  'border-box',
        background: '#f5f8fc',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ minWidth: Math.max(560, totalCols * 170) }}>

        {/* ── Root ヘッダー ─────────────────────────────────────────── */}
        {rootNode && (
          <div
            style={{
              background:    '#1a3560',
              color:         '#ffffff',
              borderRadius:  10,
              padding:       '13px 24px',
              marginBottom:  20,
              fontSize:      15,
              fontWeight:    700,
              textAlign:     'center',
              lineHeight:    1.45,
              boxShadow:     '0 4px 18px rgba(26,53,96,0.22)',
              letterSpacing: '0.02em',
            }}
          >
            <InlineEdit
              text={rootNode.label}
              onSave={v => onNodeEdit(rootNode.id, { label: v })}
              style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', textAlign: 'center' }}
              taStyle={{ color: '#ffffff', fontSize: 15, fontWeight: 700, textAlign: 'center' }}
            />
          </div>
        )}

        {/* ── Branch 列グリッド ─────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            gap:                 12,
            alignItems:          'start',
          }}
        >
          {branches.map((branch, i) => {
            const c          = PALETTE[i % PALETTE.length]
            const branchLeaves = leavesByBranch.get(branch.id) ?? []

            return (
              <div
                key={branch.id}
                style={{
                  background:   c.colBg,
                  borderRadius: 10,
                  overflow:     'hidden',
                  border:       `2px solid ${c.divider}`,
                  boxShadow:    `0 2px 10px ${c.main}18`,
                  display:      'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Branch ヘッダー */}
                <div
                  style={{
                    background:    c.main,
                    color:         '#ffffff',
                    padding:       '11px 12px',
                    fontWeight:    700,
                    fontSize:      13,
                    textAlign:     'center',
                    lineHeight:    1.4,
                    letterSpacing: '0.01em',
                  }}
                >
                  <InlineEdit
                    text={branch.label}
                    onSave={v => onNodeEdit(branch.id, { label: v })}
                    style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', textAlign: 'center' }}
                    taStyle={{ color: '#ffffff', fontSize: 13, fontWeight: 700, textAlign: 'center' }}
                  />
                </div>

                {/* Leaf グループ群 */}
                <div
                  style={{
                    flex:          1,
                    padding:       '12px 10px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           10,
                  }}
                >
                  {branchLeaves.length === 0 ? (
                    <span
                      style={{
                        fontSize:  11,
                        color:     c.chipFg,
                        opacity:   0.35,
                        textAlign: 'center',
                        fontStyle: 'italic',
                        paddingTop: 12,
                      }}
                    >
                      —
                    </span>
                  ) : (
                    branchLeaves.map(lf => (
                      <LeafGroup
                        key={lf.id}
                        node={lf}
                        c={c}
                        onEdit={onNodeEdit}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}

          {branches.length === 0 && (
            <div
              style={{
                gridColumn: `1 / ${totalCols + 1}`,
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 14,
                padding: '40px 0',
              }}
            >
              カテゴリーが分類されていません
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
