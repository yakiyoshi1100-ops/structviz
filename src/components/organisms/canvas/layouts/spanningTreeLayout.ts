import type { StructuredNode, StructuredEdge } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// Spanning Tree Layout — LR ツリー（親ノード高さ＝子スパン方式）
// ──────────────────────────────────────────────────────────────────────────────
// 【原理】
//   parent.height = Σ child.height + gap × (n−1)
//
//   親ノードの高さを子ノード群の合計スパンに合わせることで、
//   各エッジは親ノードの右側の対応する高さから水平に出て子ノードへ到達する。
//   エッジどうしは Y 座標が分散するため交差しない。
//
// 【定数】
//   LEAF_H  : 葉ノードの高さ（px）
//   V_GAP   : 兄弟ノード間の縦方向ギャップ（px）
//   H_STEP  : 深さ 1 段あたりの水平距離（ノード幅＋水平ギャップ、px）
// ══════════════════════════════════════════════════════════════════════════════

export const SPAN_NODE_W  = 160   // px — 途中ノード（子あり）の幅
const LEAF_H              = 52    // px — 最終ノードの高さ（バッジ16px + テキスト1行 + 余白）
const LEAF_FONT_SIZE      = 12    // px — 最終ノードのフォントサイズ（TreeNode と一致）
const LEAF_PADDING_H      = 28    // px — 最終ノードの左右合計パディング
const LEAF_MIN_W          = 120   // px — 最終ノードの最小幅
const V_GAP               = 10    // px — 兄弟間縦ギャップ
export const H_STEP       = 250   // px — SPAN_NODE_W(160) + H_GAP(90)

// ── 文字コード判定によるテキスト幅推定 ────────────────────────────────────────
// canvas.measureText はフォント未ロード時に誤差が大きいため、
// Unicode 範囲で全角／半角を判定して px 幅を算出する。
//   全角（CJK・ひらがな・カタカナ・全角記号）: LEAF_FONT_SIZE × 1.05
//   半角（ASCII・半角記号）                  : LEAF_FONT_SIZE × 0.60
function measureTextPx(text: string): number {
  let w = 0
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0
    const isFullWidth =
      (cp >= 0x1100 && cp <= 0x115F) ||   // Hangul Jamo
      (cp >= 0x2E80 && cp <= 0x2EFF) ||   // CJK Radicals
      (cp >= 0x2F00 && cp <= 0x2FDF) ||   // Kangxi
      (cp >= 0x3000 && cp <= 0x9FFF) ||   // CJK, Hiragana, Katakana, etc.
      (cp >= 0xA000 && cp <= 0xA4CF) ||   // Yi
      (cp >= 0xAC00 && cp <= 0xD7AF) ||   // Hangul syllables
      (cp >= 0xF900 && cp <= 0xFAFF) ||   // CJK Compatibility
      (cp >= 0xFE10 && cp <= 0xFE1F) ||   // Vertical forms
      (cp >= 0xFE30 && cp <= 0xFE4F) ||   // CJK Compatibility Forms
      (cp >= 0xFF00 && cp <= 0xFF60) ||   // Fullwidth Latin / Halfwidth Katakana headers
      (cp >= 0xFFE0 && cp <= 0xFFE6)      // Fullwidth signs
    w += isFullWidth
      ? LEAF_FONT_SIZE * 1.05
      : LEAF_FONT_SIZE * 0.60
  }
  return w
}

export interface SpanLayoutNode {
  id:                   string
  x:                    number
  y:                    number
  width:                number
  height:               number
  depth:                number
  /**
   * 子エッジの接続点 Y 位置（ノード高さに対する割合 [0, 1]）。
   * childrenOf[id] と同じ順序で並ぶ。
   */
  sourceHandlePercents: number[]
}

export function applySpanningLayout(
  nodes: StructuredNode[],
  edges: StructuredEdge[],
): SpanLayoutNode[] {
  if (nodes.length === 0) return []

  const nodeIds = new Set(nodes.map(n => n.id))

  // ── 有向隣接リスト（エッジ出現順を保持） ──────────────────────────────────
  const childrenOf = new Map<string, string[]>()
  const hasParent  = new Set<string>()
  nodes.forEach(n => childrenOf.set(n.id, []))
  edges.forEach(e => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return
    // 重複エッジは除外
    const list = childrenOf.get(e.source)!
    if (!list.includes(e.target)) {
      list.push(e.target)
      hasParent.add(e.target)
    }
  })

  // ── ルートノード ────────────────────────────────────────────────────────────
  const roots = nodes.filter(n => !hasParent.has(n.id))
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0])

  // ── BFS で深さを割り当て ────────────────────────────────────────────────────
  const depthOf = new Map<string, number>()
  const bfsQ: { id: string; d: number }[] = roots.map(r => ({ id: r.id, d: 0 }))
  while (bfsQ.length > 0) {
    const { id, d } = bfsQ.shift()!
    if (depthOf.has(id)) continue
    depthOf.set(id, d)
    childrenOf.get(id)?.forEach(c => bfsQ.push({ id: c, d: d + 1 }))
  }

  // ── 高さの再帰計算 ───────────────────────────────────────────────────────────
  // parent.height = Σ child.height + V_GAP × (n−1)
  const heightOf = new Map<string, number>()
  function computeHeight(id: string): number {
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) {
      heightOf.set(id, LEAF_H)
      return LEAF_H
    }
    const h = children.reduce((s, c) => s + computeHeight(c), 0)
            + V_GAP * (children.length - 1)
    heightOf.set(id, h)
    return h
  }
  roots.forEach(r => computeHeight(r.id))

  // ── ノード配置（再帰） ───────────────────────────────────────────────────────
  const topYOf = new Map<string, number>()
  function place(id: string, yTop: number) {
    topYOf.set(id, yTop)
    let cy = yTop
    childrenOf.get(id)?.forEach(cId => {
      place(cId, cy)
      cy += (heightOf.get(cId) ?? LEAF_H) + V_GAP
    })
  }
  let rootY = 0
  roots.forEach(r => {
    place(r.id, rootY)
    rootY += (heightOf.get(r.id) ?? LEAF_H) + V_GAP
  })

  // ── 孤立ノード（非接続・サイクル）を末尾に配置 ────────────────────────────
  nodes.forEach(n => {
    if (!topYOf.has(n.id)) {
      topYOf.set(n.id, rootY)
      heightOf.set(n.id, LEAF_H)
      depthOf.set(n.id, 0)
      rootY += LEAF_H + V_GAP
    }
  })

  // ── 結果構築 ─────────────────────────────────────────────────────────────────
  return nodes.map(n => {
    const yTop   = topYOf.get(n.id)!
    const height = heightOf.get(n.id)!
    const depth  = depthOf.get(n.id) ?? 0
    const x      = depth * H_STEP

    const children = childrenOf.get(n.id) ?? []
    const isLeaf   = children.length === 0

    const sourceHandlePercents = children.map(cId => {
      const cy = topYOf.get(cId)!
      const ch = heightOf.get(cId)!
      // 子ノード中心の Y が親ノード高さのどの割合にあるか
      return (cy + ch / 2 - yTop) / height
    })

    // 最終ノード（子なし）: テキスト幅を計測して1行ぴったりの幅に設定
    // 途中ノード（子あり）: スパン幅のまま
    const width = isLeaf
      ? Math.max(LEAF_MIN_W, Math.ceil(measureTextPx(n.label)) + LEAF_PADDING_H)
      : SPAN_NODE_W

    return { id: n.id, x, y: yTop, width, height, depth, sourceHandlePercents }
  })
}
