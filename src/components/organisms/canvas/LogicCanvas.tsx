import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react'

import { FrameworkType, type FrameworkGraph, type StructuredEdge, type StructuredNode } from '@/types'

// ── ロールスタイル定義 ────────────────────────────────────────────────────────
interface RoleStyle {
  bg: string; fg: string; border: string; shadow: string
  badge: string; badgeBg: string; badgeFg: string
  edgeStroke: string; edgeWidth: number
  fontSize: number; fontWeight: number
}

const ROLE_STYLE: Record<string, RoleStyle> = {
  major_premise: {
    bg: '#1a3560', fg: '#fff', border: 'none',
    shadow:     '0 4px 16px rgba(26,53,96,0.28)',
    badge:      '大前提', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#fff',
    edgeStroke: '#1a3560', edgeWidth: 2.5, fontSize: 13, fontWeight: 600,
  },
  minor_premise: {
    bg: '#0d7490', fg: '#fff', border: 'none',
    shadow:     '0 4px 16px rgba(13,116,144,0.28)',
    badge:      '小前提', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#fff',
    edgeStroke: '#0d7490', edgeWidth: 2.5, fontSize: 13, fontWeight: 600,
  },
  conclusion: {
    bg: '#4c1d95', fg: '#fff', border: 'none',
    shadow:     '0 4px 18px rgba(76,29,149,0.32)',
    badge:      '結論', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#fff',
    edgeStroke: '#7c3aed', edgeWidth: 2, fontSize: 14, fontWeight: 700,
  },
  observation: {
    bg: '#059669', fg: '#ffffff', border: 'none',
    shadow:     '0 3px 12px rgba(5,150,105,0.28)',
    badge:      '観察', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#ffffff',
    edgeStroke: '#059669', edgeWidth: 1.8, fontSize: 12, fontWeight: 500,
  },
  pattern: {
    bg: '#0d7490', fg: '#fff', border: 'none',
    shadow:     '0 3px 12px rgba(13,116,144,0.25)',
    badge:      'パターン', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#fff',
    edgeStroke: '#0d7490', edgeWidth: 2, fontSize: 13, fontWeight: 600,
  },
  generalization: {
    bg: '#1a3560', fg: '#fff', border: 'none',
    shadow:     '0 4px 18px rgba(26,53,96,0.30)',
    badge:      '一般化', badgeBg: 'rgba(255,255,255,0.16)', badgeFg: '#fff',
    edgeStroke: '#1a3560', edgeWidth: 2.5, fontSize: 14, fontWeight: 700,
  },
}

const FALLBACK_STYLE: RoleStyle = {
  bg: '#f1f5f9', fg: '#334155', border: '1.5px solid #cbd5e1',
  shadow:     '0 1px 4px rgba(0,0,0,0.07)',
  badge:      '—', badgeBg: '#e2e8f0', badgeFg: '#475569',
  edgeStroke: '#94a3b8', edgeWidth: 1.5, fontSize: 12, fontWeight: 400,
}

// ══════════════════════════════════════════════════════════════════════════════
// DEDUCTION — Multi-Handle Spread（バリセンター配置 + エッジ非重複）
// ══════════════════════════════════════════════════════════════════════════════
const HANDLE_COUNT = 7
const HANDLE_LEFTS = ['5%', '20%', '35%', '50%', '65%', '80%', '95%']

function spreadHandleIdx(index: number, total: number): number {
  if (total <= 1) return Math.floor(HANDLE_COUNT / 2)
  return Math.round(index / (total - 1) * (HANDLE_COUNT - 1))
}

// ── DEDUCTION レイアウト定数 ─────────────────────────────────────────────────
const NODE_W = 210
const NODE_H = 82
const H_GAP  = 60
const V_GAP  = 90

// ──────────────────────────────────────────────────────────────────────────────
// DEDUCTION レイアウト（バリセンター配置）
// ──────────────────────────────────────────────────────────────────────────────
function layoutDeduction(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
): StructuredNode[] {
  const major = nodes.filter(n => n.role === 'major_premise')
  const minor = nodes.filter(n => n.role === 'minor_premise')
  const concl = nodes.filter(n => n.role === 'conclusion')
  const other = nodes.filter(n =>
    !['major_premise', 'minor_premise', 'conclusion'].includes(n.role)
  )

  const result: StructuredNode[] = []
  const CONCL_STEP = NODE_W + H_GAP
  const ROW_STEP   = NODE_H + 100
  const LAYER_GAP  = 110
  const X_MIN_GAP  = 24
  const Y_MIN_GAP  = 28

  const conclCenterX = new Map<string, number>()
  concl.forEach((c, i) => {
    conclCenterX.set(c.id, i * CONCL_STEP + NODE_W / 2)
  })
  const conclTotalW = concl.length > 0
    ? (concl.length - 1) * CONCL_STEP + NODE_W
    : NODE_W

  const computeBarycenter = (group: StructuredNode[]) => {
    const m = new Map<string, number>()
    group.forEach(p => {
      const targets = edges
        .filter(e => e.source === p.id)
        .map(e => conclCenterX.get(e.target))
        .filter((x): x is number => x !== undefined)
      const bc = targets.length > 0
        ? targets.reduce((a, b) => a + b, 0) / targets.length
        : conclTotalW / 2
      m.set(p.id, bc)
    })
    return m
  }

  const majorBary = computeBarycenter(major)
  const minorBary = computeBarycenter(minor)

  const sortedMajor = [...major].sort((a, b) =>
    (majorBary.get(a.id) ?? 0) - (majorBary.get(b.id) ?? 0)
  )
  const sortedMinor = [...minor].sort((a, b) =>
    (minorBary.get(a.id) ?? 0) - (minorBary.get(b.id) ?? 0)
  )

  type Box = { xL: number; xR: number; yT: number; yB: number }

  const placeGroup = (
    sortedNodes: StructuredNode[],
    bary: Map<string, number>,
    baseY: number,
  ): number => {
    const placed: Box[] = []
    sortedNodes.forEach(p => {
      const x  = (bary.get(p.id) ?? 0) - NODE_W / 2
      const xR = x + NODE_W
      let row = 0
      let y = baseY
      while (row < 20) {
        y = baseY + row * ROW_STEP
        const yB = y + NODE_H
        const collides = placed.some(pl => {
          const xOverlap = !(xR + X_MIN_GAP <= pl.xL || pl.xR + X_MIN_GAP <= x)
          const yOverlap = !(yB + Y_MIN_GAP <= pl.yT || pl.yB + Y_MIN_GAP <= y)
          return xOverlap && yOverlap
        })
        if (!collides) break
        row++
      }
      placed.push({ xL: x, xR, yT: y, yB: y + NODE_H })
      result.push({ ...p, position: { x, y } })
    })
    return placed.length > 0
      ? Math.max(...placed.map(b => b.yB))
      : baseY
  }

  const majorBottomY = placeGroup(sortedMajor, majorBary, 0)
  const minorStartY  = majorBottomY + LAYER_GAP
  const minorBottomY = placeGroup(sortedMinor, minorBary, minorStartY)
  const conclY = minorBottomY + LAYER_GAP
  concl.forEach((c, i) => {
    result.push({ ...c, position: { x: i * CONCL_STEP, y: conclY } })
  })
  other.forEach((n, i) => {
    result.push({ ...n, position: { x: i * (NODE_W + H_GAP), y: conclY + NODE_H + V_GAP } })
  })

  return result
}

// ══════════════════════════════════════════════════════════════════════════════
// INDUCTION — TB Spanning Tree（PyramidCanvas と同発想・Y 軸反転）
//
// データエッジ: observation → pattern → generalization
// レイアウト用逆転ツリー: gen を root として gen→patt→obs を構築
//   parent.width = Σ child.width + H_GAP × (n-1)
//   obs=上, patt=中, gen=下 になるよう Y 反転は不要（直接 Y を割り当てる）
//
// ノード幅:
//   obs       : IND_LEAF_W（固定・狭め）
//   patt      : Σ obs.width + gaps（obs 群をスパン）
//   gen       : Σ patt.width + gaps（全体をスパン）
// エッジ:
//   obs  → patt: obs 底面 → patt 天面（obs 中心 X を patt 幅内の割合で指定）
//   patt → gen : patt 底面 → gen 天面（patt 中心 X を gen 幅内の割合で指定）
// ══════════════════════════════════════════════════════════════════════════════

const IND_LEAF_W = 180   // obs ノード幅
const IND_NODE_H = 82    // 全 induction ノード共通高さ
const IND_H_GAP  = 20    // 兄弟間水平ギャップ
const IND_V_GAP  = 60    // 層間垂直ギャップ

interface InductionLayoutNode {
  id:                   string
  x:                    number
  y:                    number
  width:                number
  height:               number
  /** 底面 Source ハンドルの X 位置（node width に対する割合） */
  sourceHandlePercents: number[]
  /** 天面 Target ハンドルの X 位置（node width に対する割合） */
  targetHandlePercents: number[]
}

interface InductionLayout {
  nodes:           InductionLayoutNode[]
  /** pattId → [obsId]  (ソート済み)  天面ハンドル割当に使用 */
  obsChildrenOf:   Map<string, string[]>
  /** genId  → [pattId] (ソート済み)  天面ハンドル割当に使用 */
  pattChildrenOf:  Map<string, string[]>
}

function applyInductionLayout(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
): InductionLayout {
  const obs   = nodes.filter(n => n.role === 'observation')
  const patt  = nodes.filter(n => n.role === 'pattern')
  const gen   = nodes.filter(n => n.role === 'generalization')
  const other = nodes.filter(n =>
    !['observation', 'pattern', 'generalization'].includes(n.role)
  )

  // ── 逆方向 有向隣接リスト（gen→patt→obs）────────────────────────────────
  const childrenOf = new Map<string, string[]>()
  nodes.forEach(n => childrenOf.set(n.id, []))

  const nodeRole = new Map(nodes.map(n => [n.id, n.role]))
  edges.forEach(e => {
    const sr = nodeRole.get(e.source)
    const tr = nodeRole.get(e.target)
    if (sr === 'observation' && tr === 'pattern') {
      const list = childrenOf.get(e.target)!
      if (!list.includes(e.source)) list.push(e.source)
    }
    if (sr === 'pattern' && tr === 'generalization') {
      const list = childrenOf.get(e.target)!
      if (!list.includes(e.source)) list.push(e.source)
    }
  })

  // ── 子リストをソートして inter-group 交差を最小化 ──────────────────────
  // obs 子を自然順に、patt 子を「最大 obs インデックス昇順」にソート
  const obsIdx = new Map<string, number>(obs.map((o, i) => [o.id, i]))

  patt.forEach(p => {
    const ch = childrenOf.get(p.id)
    if (ch) ch.sort((a, b) => (obsIdx.get(a) ?? 0) - (obsIdx.get(b) ?? 0))
  })

  gen.forEach(g => {
    const ch = childrenOf.get(g.id)
    if (!ch) return
    ch.sort((a, b) => {
      const chA = childrenOf.get(a) ?? []
      const chB = childrenOf.get(b) ?? []
      const maxA = chA.length > 0
        ? Math.max(...chA.map(oId => obsIdx.get(oId) ?? 0))
        : (obsIdx.get(a) ?? 0)
      const maxB = chB.length > 0
        ? Math.max(...chB.map(oId => obsIdx.get(oId) ?? 0))
        : (obsIdx.get(b) ?? 0)
      return maxA - maxB
    })
  })

  // ── 幅の再帰計算（parent.width = Σ child.width + H_GAP × (n-1)）────────
  const widthOf = new Map<string, number>()
  function computeWidth(id: string): number {
    if (widthOf.has(id)) return widthOf.get(id)!
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) {
      widthOf.set(id, IND_LEAF_W); return IND_LEAF_W
    }
    const w = children.reduce((s, c) => s + computeWidth(c), 0)
            + IND_H_GAP * (children.length - 1)
    widthOf.set(id, w)
    return w
  }
  gen.forEach(g => computeWidth(g.id))
  patt.forEach(p => { if (!widthOf.has(p.id)) computeWidth(p.id) })
  obs.forEach(o => { if (!widthOf.has(o.id)) widthOf.set(o.id, IND_LEAF_W) })

  // ── 左端 X 座標の配置 ────────────────────────────────────────────────────
  const leftXOf = new Map<string, number>()
  function place(id: string, xLeft: number) {
    leftXOf.set(id, xLeft)
    let cx = xLeft
    for (const cId of (childrenOf.get(id) ?? [])) {
      place(cId, cx)
      cx += (widthOf.get(cId) ?? IND_LEAF_W) + IND_H_GAP
    }
  }
  let curX = 0
  gen.forEach(g => {
    place(g.id, curX)
    curX += (widthOf.get(g.id) ?? IND_LEAF_W) + IND_H_GAP
  })
  patt.forEach(p => {
    if (!leftXOf.has(p.id)) { place(p.id, curX); curX += (widthOf.get(p.id) ?? IND_LEAF_W) + IND_H_GAP }
  })
  obs.forEach(o => {
    if (!leftXOf.has(o.id)) { leftXOf.set(o.id, curX); curX += IND_LEAF_W + IND_H_GAP }
  })

  // ── Y 座標（obs=上, patt=中, gen=下）────────────────────────────────────
  const yObs  = 0
  const yPatt = IND_NODE_H + IND_V_GAP
  const yGen  = 2 * (IND_NODE_H + IND_V_GAP)

  // ── 各ノードのハンドル位置を計算 ─────────────────────────────────────────
  const resultNodes: InductionLayoutNode[] = []

  obs.forEach(o => {
    const xLeft = leftXOf.get(o.id) ?? 0
    resultNodes.push({
      id: o.id, x: xLeft, y: yObs,
      width: IND_LEAF_W, height: IND_NODE_H,
      sourceHandlePercents: [0.5],   // bottom center → pattern
      targetHandlePercents: [],
    })
  })

  patt.forEach(p => {
    const xLeft      = leftXOf.get(p.id) ?? 0
    const w          = widthOf.get(p.id) ?? IND_LEAF_W
    const obsChildren = childrenOf.get(p.id) ?? []

    // 天面ターゲット: obs 各中心の patt 幅内割合
    const targetPercents = obsChildren.map(oId => {
      const ox = leftXOf.get(oId) ?? 0
      return (ox + IND_LEAF_W / 2 - xLeft) / w
    })

    resultNodes.push({
      id: p.id, x: xLeft, y: yPatt,
      width: w, height: IND_NODE_H,
      // patt 中央から真下に落とす → gen target handle と X 一致 → 垂直エッジ
      sourceHandlePercents: [0.5],
      targetHandlePercents: targetPercents,
    })
  })

  gen.forEach(g => {
    const xLeft       = leftXOf.get(g.id) ?? 0
    const w           = widthOf.get(g.id) ?? IND_LEAF_W
    const pattChildren = childrenOf.get(g.id) ?? []

    // 天面ターゲット: patt 各中心の gen 幅内割合
    const targetPercents = pattChildren.map(pId => {
      const px = leftXOf.get(pId) ?? 0
      const pw = widthOf.get(pId) ?? IND_LEAF_W
      return (px + pw / 2 - xLeft) / w
    })

    resultNodes.push({
      id: g.id, x: xLeft, y: yGen,
      width: w, height: IND_NODE_H,
      sourceHandlePercents: [],
      targetHandlePercents: targetPercents,
    })
  })

  other.forEach((n, i) => {
    resultNodes.push({
      id: n.id,
      x: curX + i * (IND_LEAF_W + IND_H_GAP),
      y: yGen + IND_NODE_H + IND_V_GAP,
      width: IND_LEAF_W, height: IND_NODE_H,
      sourceHandlePercents: [0.5],
      targetHandlePercents: [0.5],
    })
  })

  // ── エッジハンドル割当用マップを返す ─────────────────────────────────────
  const obsChildrenOf  = new Map<string, string[]>()
  const pattChildrenOf = new Map<string, string[]>()
  patt.forEach(p => { obsChildrenOf.set(p.id,  childrenOf.get(p.id) ?? []) })
  gen.forEach(g  => { pattChildrenOf.set(g.id, childrenOf.get(g.id) ?? []) })

  return { nodes: resultNodes, obsChildrenOf, pattChildrenOf }
}

// ── フォールバックエッジ生成 ──────────────────────────────────────────────────
function makeFallbackEdges(nodes: StructuredNode[], frameworkType: string): StructuredEdge[] {
  if (frameworkType === FrameworkType.DEDUCTION) {
    const conclusion = nodes.find(n => n.role === 'conclusion')
    if (!conclusion) return []
    return nodes
      .filter(n => ['major_premise', 'minor_premise'].includes(n.role))
      .map(n => ({ id: `fb_${n.id}_${conclusion.id}`, source: n.id, target: conclusion.id }))
  }
  const gen      = nodes.find(n => n.role === 'generalization')
  const patterns = nodes.filter(n => n.role === 'pattern')
  const obs      = nodes.filter(n => n.role === 'observation')
  const result: StructuredEdge[] = []
  if (patterns.length > 0 && gen) {
    patterns.forEach(p =>
      result.push({ id: `fb_${p.id}_${gen.id}`, source: p.id, target: gen.id })
    )
    obs.forEach((o, i) => {
      const target = patterns[i % patterns.length]
      result.push({ id: `fb_${o.id}_${target.id}`, source: o.id, target: target.id })
    })
  } else if (gen) {
    obs.forEach(o =>
      result.push({ id: `fb_${o.id}_${gen.id}`, source: o.id, target: gen.id })
    )
  }
  return result
}

// ══════════════════════════════════════════════════════════════════════════════
// DEDUCTION ノードコンポーネント
// ══════════════════════════════════════════════════════════════════════════════
interface LogicNodeData extends Record<string, unknown> {
  label:   string
  role:    string
  onEdit?: (id: string, label: string) => void
}

function LogicNode({ id, data }: NodeProps) {
  const d  = data as LogicNodeData
  const st = ROLE_STYLE[d.role] ?? FALLBACK_STYLE
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(d.label)

  useEffect(() => setValue(d.label), [d.label])

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== d.label) d.onEdit?.(id, t)
    else setValue(d.label)
  }

  return (
    <div
      style={{
        width: NODE_W, background: st.bg, color: st.fg,
        border: st.border, borderRadius: 10, boxShadow: st.shadow,
        overflow: 'hidden', wordBreak: 'break-word', lineHeight: 1.45, position: 'relative',
      }}
      onDoubleClick={() => { setEditing(true); setValue(d.label) }}
      title="ダブルクリックで編集"
    >
      {HANDLE_LEFTS.map((left, i) => (
        <Handle key={`top-${i}`} id={`top-${i}`} type="target" position={Position.Top}
          style={{ opacity: 0, pointerEvents: 'none', left }} />
      ))}
      <div style={{
        background: st.badgeBg, color: st.badgeFg,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textAlign: 'center', padding: '4px 0',
      }}>
        {st.badge}
      </div>
      <div style={{ padding: '8px 12px', textAlign: 'center', fontSize: st.fontSize, fontWeight: st.fontWeight }}>
        {editing ? (
          <textarea autoFocus value={value} rows={2}
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
        ) : d.label}
      </div>
      {HANDLE_LEFTS.map((left, i) => (
        <Handle key={`bot-${i}`} id={`bot-${i}`} type="source" position={Position.Bottom}
          style={{ opacity: 0, pointerEvents: 'none', left }} />
      ))}
      {HANDLE_LEFTS.map((left, i) => (
        <Handle key={`bot-in-${i}`} id={`bot-in-${i}`} type="target" position={Position.Bottom}
          style={{ opacity: 0, pointerEvents: 'none', left }} />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INDUCTION ノードコンポーネント（スパン幅で描画）
// ══════════════════════════════════════════════════════════════════════════════
interface InductionNodeData extends Record<string, unknown> {
  label:                string
  role:                 string
  sourceHandlePercents: number[]
  targetHandlePercents: number[]
  onEdit?: (id: string, label: string) => void
}

function InductionNode({ id, data }: NodeProps) {
  const d  = data as InductionNodeData
  const st = ROLE_STYLE[d.role] ?? FALLBACK_STYLE
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(d.label)

  useEffect(() => setValue(d.label), [d.label])

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== d.label) d.onEdit?.(id, t)
    else setValue(d.label)
  }

  return (
    <div
      style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        background: st.bg, color: st.fg, border: st.border,
        borderRadius: 10, boxShadow: st.shadow,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}
      onDoubleClick={() => { setEditing(true); setValue(d.label) }}
      title="ダブルクリックで編集"
    >
      {/* 天面 Target ハンドル */}
      {d.targetHandlePercents.length > 0
        ? d.targetHandlePercents.map((pct, i) => (
            <Handle key={`top-${i}`} id={`top-${i}`} type="target" position={Position.Top}
              style={{ opacity: 0, pointerEvents: 'none', left: `${Math.round(pct * 100)}%` }} />
          ))
        : <Handle id="top-0" type="target" position={Position.Top}
            style={{ opacity: 0, pointerEvents: 'none', left: '50%' }} />
      }

      {/* ロールバッジ */}
      <div style={{
        background: st.badgeBg, color: st.badgeFg,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
        padding: '2px 10px', borderRadius: 3, marginBottom: 5,
        flexShrink: 0,
      }}>
        {st.badge}
      </div>

      {/* ラベル */}
      {editing ? (
        <textarea autoFocus value={value} rows={2}
          style={{
            width: '90%', resize: 'none', background: 'transparent',
            border: 'none', outline: 'none', color: 'inherit',
            fontWeight: st.fontWeight, fontSize: st.fontSize, textAlign: 'center',
            fontFamily: 'inherit', lineHeight: '1.45', padding: 0,
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
        <span style={{
          fontSize: st.fontSize, fontWeight: st.fontWeight, lineHeight: 1.45,
          textAlign: 'center', wordBreak: 'break-word',
          padding: '0 14px', maxWidth: '100%',
        }}>
          {d.label}
        </span>
      )}

      {/* 底面 Source ハンドル */}
      {d.sourceHandlePercents.length > 0
        ? d.sourceHandlePercents.map((pct, i) => (
            <Handle key={`bot-${i}`} id={`bot-${i}`} type="source" position={Position.Bottom}
              style={{ opacity: 0, pointerEvents: 'none', left: `${Math.round(pct * 100)}%` }} />
          ))
        : <Handle id="bot-0" type="source" position={Position.Bottom}
            style={{ opacity: 0, pointerEvents: 'none', left: '50%' }} />
      }
    </div>
  )
}

const nodeTypes = { logicNode: LogicNode, inductionNode: InductionNode }

// ── カスタムエッジ: 下から回り込む弧（DEDUCTION 専用）────────────────────────
interface WrapArcData extends Record<string, unknown> {
  arcDepth:    number
  stroke:      string
  strokeWidth: number
}

function WrapArcEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, data }: EdgeProps) {
  const d = (data ?? { arcDepth: 120, stroke: '#94a3b8', strokeWidth: 1.5 }) as WrapArcData
  const baseY = Math.max(sourceY, targetY)
  const arcY  = baseY + d.arcDepth
  const path  = `M ${sourceX} ${sourceY} C ${sourceX} ${arcY}, ${targetX} ${arcY}, ${targetX} ${targetY}`
  return (
    <BaseEdge id={id} path={path}
      style={{ stroke: d.stroke, strokeWidth: d.strokeWidth, fill: 'none' }}
      markerEnd={markerEnd}
    />
  )
}

const edgeTypes = { wrapArc: WrapArcEdge }

// ── AutoFitView ───────────────────────────────────────────────────────────────
function AutoFitView({ version }: { version: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.22, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [version, fitView])
  return null
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface LogicCanvasProps {
  graph:      FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function LogicCanvas({ graph, onNodeEdit }: LogicCanvasProps) {
  const version     = useMemo(() => Date.now(), [graph])
  const isInduction = graph.frameworkType === FrameworkType.INDUCTION

  // ── エッジ前処理（重複除去 + フォールバック）────────────────────────────────
  const edges = useMemo(() => {
    const raw = graph.edges.length > 0
      ? graph.edges
      : makeFallbackEdges(graph.nodes, graph.frameworkType)
    const seen = new Set<string>()
    return raw.filter(e => {
      const key = `${e.source}→${e.target}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [graph])

  // ══════════════════════════════════════════════════════════════════════════
  // INDUCTION パス
  // ══════════════════════════════════════════════════════════════════════════
  const inductionLayout = useMemo(
    () => isInduction ? applyInductionLayout(graph.nodes, edges) : null,
    [isInduction, graph.nodes, edges],
  )

  const inductionFlowNodes = useMemo<Node[]>(() => {
    if (!isInduction || !inductionLayout) return []
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]))
    return inductionLayout.nodes.map(ln => ({
      id:         ln.id,
      type:       'inductionNode',
      position:   { x: ln.x, y: ln.y },
      width:      ln.width,
      height:     ln.height,
      draggable:  false,
      selectable: false,
      style:      { width: ln.width, height: ln.height, padding: 0, maxWidth: 'none' },
      data: {
        label:                nodeMap.get(ln.id)?.label ?? '',
        role:                 nodeMap.get(ln.id)?.role  ?? '',
        sourceHandlePercents: ln.sourceHandlePercents,
        targetHandlePercents: ln.targetHandlePercents,
        onEdit: (nid: string, label: string) => onNodeEdit(nid, { label }),
      } satisfies InductionNodeData,
    }))
  }, [isInduction, inductionLayout, graph.nodes, onNodeEdit])

  const inductionFlowEdges = useMemo<Edge[]>(() => {
    if (!isInduction || !inductionLayout) return []
    const nodeRole = new Map(graph.nodes.map(n => [n.id, n.role]))
    return edges.map(e => {
      const srcRole = nodeRole.get(e.source) ?? ''
      const st      = ROLE_STYLE[srcRole] ?? FALLBACK_STYLE

      let sourceHandle = 'bot-0'
      let targetHandle = 'top-0'

      if (srcRole === 'observation') {
        const siblings = inductionLayout.obsChildrenOf.get(e.target) ?? []
        const idx      = siblings.indexOf(e.source)
        if (idx >= 0) targetHandle = `top-${idx}`
      } else if (srcRole === 'pattern') {
        const siblings = inductionLayout.pattChildrenOf.get(e.target) ?? []
        const idx      = siblings.indexOf(e.source)
        if (idx >= 0) targetHandle = `top-${idx}`
      }

      return {
        id:           e.id,
        source:       e.source,
        target:       e.target,
        sourceHandle,
        targetHandle,
        type:         'straight',   // ハンドル X が一致 → 垂直線
        style:        { stroke: st.edgeStroke, strokeWidth: st.edgeWidth },
        markerEnd:    { type: MarkerType.ArrowClosed, color: st.edgeStroke, width: 14, height: 14 },
      }
    })
  }, [isInduction, inductionLayout, edges, graph.nodes])

  // ══════════════════════════════════════════════════════════════════════════
  // DEDUCTION パス
  // ══════════════════════════════════════════════════════════════════════════
  const laidOut = useMemo(
    () => !isInduction ? layoutDeduction(graph.nodes, edges) : [],
    [isInduction, graph.nodes, edges],
  )

  const nodeRoleMap = useMemo(
    () => new Map(graph.nodes.map(n => [n.id, n.role] as [string, string])),
    [graph.nodes],
  )

  const nodeCenterX = useMemo(() => {
    const m = new Map<string, number>()
    laidOut.forEach(n => m.set(n.id, n.position.x + NODE_W / 2))
    return m
  }, [laidOut])

  const edgeById = useMemo(
    () => new Map(edges.map(e => [e.id, e] as const)),
    [edges],
  )

  const edgesBySource = useMemo(() => {
    const m = new Map<string, string[]>()
    edges.forEach(e => {
      if (!m.has(e.source)) m.set(e.source, [])
      m.get(e.source)!.push(e.id)
    })
    m.forEach(eids => {
      eids.sort((aId, bId) => {
        const aTgt = edgeById.get(aId)!.target
        const bTgt = edgeById.get(bId)!.target
        return (nodeCenterX.get(aTgt) ?? 0) - (nodeCenterX.get(bTgt) ?? 0)
      })
    })
    return m
  }, [edges, edgeById, nodeCenterX])

  const edgesByTarget = useMemo(() => {
    const m = new Map<string, string[]>()
    edges.forEach(e => {
      if (!m.has(e.target)) m.set(e.target, [])
      m.get(e.target)!.push(e.id)
    })
    m.forEach(eids => {
      eids.sort((aId, bId) => {
        const aSrc = edgeById.get(aId)!.source
        const bSrc = edgeById.get(bId)!.source
        return (nodeCenterX.get(aSrc) ?? 0) - (nodeCenterX.get(bSrc) ?? 0)
      })
    })
    return m
  }, [edges, edgeById, nodeCenterX])

  const conclusionsLaidOut = useMemo(
    () => laidOut.filter(n => n.role === 'conclusion'),
    [laidOut],
  )

  const wrapAroundMap = useMemo(() => {
    const m = new Map<string, boolean>()
    edges.forEach(e => {
      if (isInduction) { m.set(e.id, false); return }
      const tgtRole = nodeRoleMap.get(e.target) ?? ''
      if (tgtRole !== 'conclusion') { m.set(e.id, false); return }
      const sx = nodeCenterX.get(e.source) ?? 0
      const tx = nodeCenterX.get(e.target) ?? 0
      const minX = Math.min(sx, tx), maxX = Math.max(sx, tx)
      const crosses = conclusionsLaidOut.some(c => {
        if (c.id === e.target) return false
        const cx = c.position.x + NODE_W / 2
        return cx > minX && cx < maxX
      })
      m.set(e.id, crosses)
    })
    return m
  }, [edges, nodeRoleMap, nodeCenterX, conclusionsLaidOut, isInduction])

  const arcDepths = useMemo(() => {
    const m = new Map<string, number>()
    const wrapList: Array<{ id: string; span: number }> = []
    edges.forEach(e => {
      if (!wrapAroundMap.get(e.id)) return
      const sx = nodeCenterX.get(e.source) ?? 0
      const tx = nodeCenterX.get(e.target) ?? 0
      wrapList.push({ id: e.id, span: Math.abs(sx - tx) })
    })
    wrapList.sort((a, b) => a.span - b.span)
    wrapList.forEach(({ id }, idx) => { m.set(id, 80 + idx * 75) })
    return m
  }, [edges, nodeCenterX, wrapAroundMap])

  const deductionFlowNodes = useMemo<Node[]>(
    () =>
      laidOut.map(n => ({
        id:         n.id,
        type:       'logicNode',
        position:   n.position,
        draggable:  false,
        selectable: false,
        data: {
          label:  n.label,
          role:   n.role,
          onEdit: (nid: string, label: string) => onNodeEdit(nid, { label }),
        } satisfies LogicNodeData,
      })),
    [laidOut, onNodeEdit],
  )

  const deductionFlowEdges = useMemo<Edge[]>(
    () =>
      edges.map(e => {
        const srcRole = nodeRoleMap.get(e.source) ?? ''
        const st      = ROLE_STYLE[srcRole] ?? FALLBACK_STYLE

        const tIds = edgesByTarget.get(e.target) ?? [e.id]
        const tIdx = tIds.indexOf(e.id)
        const sIds = edgesBySource.get(e.source) ?? [e.id]
        const sIdx = sIds.indexOf(e.id)

        const isWrap = wrapAroundMap.get(e.id) ?? false
        const targetHandle = isWrap
          ? `bot-in-${spreadHandleIdx(tIdx, tIds.length)}`
          : `top-${spreadHandleIdx(tIdx, tIds.length)}`
        const sourceHandle = `bot-${spreadHandleIdx(sIdx, sIds.length)}`

        const markerEnd = { type: MarkerType.ArrowClosed, color: st.edgeStroke, width: 14, height: 14 }

        if (isWrap) {
          return {
            id: e.id, source: e.source, target: e.target,
            sourceHandle, targetHandle, type: 'wrapArc',
            data: { arcDepth: arcDepths.get(e.id) ?? 120, stroke: st.edgeStroke, strokeWidth: st.edgeWidth } satisfies WrapArcData,
            markerEnd,
          }
        }
        return {
          id: e.id, source: e.source, target: e.target,
          sourceHandle, targetHandle, type: 'default',
          style: { stroke: st.edgeStroke, strokeWidth: st.edgeWidth },
          markerEnd,
        }
      }),
    [edges, nodeRoleMap, edgesByTarget, edgesBySource, wrapAroundMap, arcDepths],
  )

  const flowNodes = isInduction ? inductionFlowNodes : deductionFlowNodes
  const flowEdges = isInduction ? inductionFlowEdges : deductionFlowEdges

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll
        panOnDrag
        minZoom={0.05}
      >
        <AutoFitView version={version} />
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
