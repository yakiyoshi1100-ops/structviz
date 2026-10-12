# ECRS Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ECRS分析専用キャンバスを実装し、E→C→R→S の水平シェブロンフロー＋インライン編集チップで表示する。

**Architecture:** `ECRSCanvas.tsx` を新規作成。`DMAICCanvas.tsx` と同じ3層構造（シェブロンヘッダー / 説明帯 / チップエリア）を採用し、4カテゴリ固有の色とラベルを設定する。`CanvasRouter.tsx` の `matrixFrameworks` から ECRS を削除し専用分岐を追加。

**Tech Stack:** React 18, TypeScript, CSS-in-JS（inline style）, Vite

---

## File Map

| Action | File |
|--------|------|
| 新規作成 | `src/components/organisms/canvas/ECRSCanvas.tsx` |
| 修正 | `src/components/organisms/canvas/CanvasRouter.tsx` |

---

### Task 1: ECRSCanvas.tsx を作成する

**Files:**
- Create: `src/components/organisms/canvas/ECRSCanvas.tsx`

- [ ] **Step 1: ファイルを作成する**

`src/components/organisms/canvas/ECRSCanvas.tsx` を以下の内容で作成する:

```tsx
import { useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ── カテゴリ定義 ───────────────────────────────────────────────────────────────
const CATEGORIES: Array<{
  role: NodeRole
  labelEn: string
  labelJa: string
  desc: string
}> = [
  {
    role: 'eliminate',
    labelEn: 'Eliminate',
    labelJa: '排除',
    desc: '不要な作業を\n廃止する',
  },
  {
    role: 'combine',
    labelEn: 'Combine',
    labelJa: '結合',
    desc: '複数の作業を\nまとめる',
  },
  {
    role: 'rearrange',
    labelEn: 'Rearrange',
    labelJa: '再配置',
    desc: '順序・担当を\n変える',
  },
  {
    role: 'simplify',
    labelEn: 'Simplify',
    labelJa: '簡素化',
    desc: '作業を\n簡単にする',
  },
]

// ── カラースキーム ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  {
    // Eliminate — Red
    header:  '#dc2626',
    descBg:  '#fee2e2',
    descFg:  '#7f1d1d',
    colBg:   '#fef2f2',
    chipBg:  '#fecaca',
    chipFg:  '#7f1d1d',
    divider: '#fca5a5',
  },
  {
    // Combine — Blue
    header:  '#2563eb',
    descBg:  '#dbeafe',
    descFg:  '#1e3a8a',
    colBg:   '#eff6ff',
    chipBg:  '#bfdbfe',
    chipFg:  '#1e3a8a',
    divider: '#93c5fd',
  },
  {
    // Rearrange — Amber
    header:  '#d97706',
    descBg:  '#fef3c7',
    descFg:  '#78350f',
    colBg:   '#fffbeb',
    chipBg:  '#fde68a',
    chipFg:  '#78350f',
    divider: '#fcd34d',
  },
  {
    // Simplify — Green
    header:  '#16a34a',
    descBg:  '#dcfce7',
    descFg:  '#14532d',
    colBg:   '#f0fdf4',
    chipBg:  '#bbf7d0',
    chipFg:  '#14532d',
    divider: '#86efac',
  },
] as const

// ── clip-path ヘルパー ─────────────────────────────────────────────────────────
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

// ── ItemChip（インライン編集対応） ────────────────────────────────────────────
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

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface ECRSCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function ECRSCanvas({ graph, onNodeEdit }: ECRSCanvasProps) {
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

        {/* ── ① タイトル ─────────────────────────────────────────────── */}
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
          ECRS — 業務改善の4原則
        </h2>

        {/* ── ② シェブロン型ヘッダー ──────────────────────────────────── */}
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

        {/* ── ③ 説明帯 ────────────────────────────────────────────────── */}
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

        {/* ── ④ チップエリア ──────────────────────────────────────────── */}
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
```

- [ ] **Step 2: TypeScript コンパイルを確認する**

```bash
npm run build
```

期待される結果: エラーなし

---

### Task 2: CanvasRouter.tsx を更新する

**Files:**
- Modify: `src/components/organisms/canvas/CanvasRouter.tsx`

- [ ] **Step 1: import を追加する**

`CanvasRouter.tsx` の `import { DMAICCanvas } from './DMAICCanvas'` の直後に追記:

```typescript
import { ECRSCanvas } from './ECRSCanvas'
```

- [ ] **Step 2: matrixFrameworks セットから ECRS を削除する**

変更前:
```typescript
const matrixFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.ECRS,
  FrameworkType.FOUR_M,
  FrameworkType.QCD,
  FrameworkType.STP,
  FrameworkType.PPM,
  FrameworkType.ABC,
  FrameworkType.YWT,
  FrameworkType.SPIN,
])
```

変更後:
```typescript
const matrixFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.FOUR_M,
  FrameworkType.QCD,
  FrameworkType.STP,
  FrameworkType.PPM,
  FrameworkType.ABC,
  FrameworkType.YWT,
  FrameworkType.SPIN,
])
```

- [ ] **Step 3: DMAIC 分岐の直後に ECRS 専用分岐を追加する**

変更前（`if (graph.frameworkType === FrameworkType.DMAIC)` ブロックの後）:
```typescript
  if (graph.frameworkType === FrameworkType.DMAIC) {
    return withZoom(<DMAICCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  // ── Pyramid / Tree 系（ZoomPan ラップ済み） ─────────────────────────────
```

変更後:
```typescript
  if (graph.frameworkType === FrameworkType.DMAIC) {
    return withZoom(<DMAICCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  if (graph.frameworkType === FrameworkType.ECRS) {
    return withZoom(<ECRSCanvas graph={graph} onNodeEdit={onNodeEdit} />)
  }

  // ── Pyramid / Tree 系（ZoomPan ラップ済み） ─────────────────────────────
```

- [ ] **Step 4: ビルドを確認する**

```bash
npm run build
```

期待される結果: エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/components/organisms/canvas/ECRSCanvas.tsx src/components/organisms/canvas/CanvasRouter.tsx
git commit -m "feat: ECRS分析キャンバスを専用コンポーネントで実装（水平シェブロンフロー）"
```
