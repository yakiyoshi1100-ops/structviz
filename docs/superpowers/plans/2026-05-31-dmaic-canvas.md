# DMAIC Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CustomerJourneyCanvas をベースに DMAIC 専用キャンバスを実装し、D→M→A→I→C の水平シェブロンフロー表示＋インライン編集を提供する。

**Architecture:** `DMAICCanvas.tsx` を新規作成し CustomerJourney と同じ3層構造（シェブロンヘッダー / 説明帯 / チップエリア）を採用。チップはダブルクリックでインライン編集可能。`CanvasRouter.tsx` から専用分岐を追加して既存の MatrixCanvas フォールバックを置き換える。

**Tech Stack:** React 18, TypeScript, CSS-in-JS（inline style）, Vite

---

## File Map

| Action | File |
|--------|------|
| 新規作成 | `src/components/organisms/canvas/DMAICCanvas.tsx` |
| 修正 | `src/components/organisms/canvas/CanvasRouter.tsx` |

---

### Task 1: DMAICCanvas.tsx を作成する

**Files:**
- Create: `src/components/organisms/canvas/DMAICCanvas.tsx`

- [ ] **Step 1: ファイルを作成する**

`src/components/organisms/canvas/DMAICCanvas.tsx` を以下の内容で作成する:

```tsx
import { useMemo, useState } from 'react'
import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

// ── フェーズ定義 ───────────────────────────────────────────────────────────────
const PHASES: Array<{
  role: NodeRole
  labelEn: string
  labelJa: string
  desc: string
}> = [
  {
    role: 'dmaic_define',
    labelEn: 'Define',
    labelJa: '定義',
    desc: '問題・目標・スコープを\n明確にする',
  },
  {
    role: 'dmaic_measure',
    labelEn: 'Measure',
    labelJa: '測定',
    desc: '現状プロセスのデータを\n収集・定量化する',
  },
  {
    role: 'dmaic_analyze',
    labelEn: 'Analyze',
    labelJa: '分析',
    desc: '根本原因を\n特定・検証する',
  },
  {
    role: 'dmaic_improve',
    labelEn: 'Improve',
    labelJa: '改善',
    desc: '根本原因を排除する\n解決策を実施する',
  },
  {
    role: 'dmaic_control',
    labelEn: 'Control',
    labelJa: '管理',
    desc: '改善を維持・標準化し\n監視する',
  },
]

// ── カラースキーム（シックスシグマ標準配色） ───────────────────────────────────
const PHASE_COLORS = [
  {
    // Define — Purple
    header:  '#7c3aed',
    descBg:  '#ede9fe',
    descFg:  '#4c1d95',
    colBg:   '#f5f3ff',
    chipBg:  '#ddd6fe',
    chipFg:  '#4c1d95',
    divider: '#c4b5fd',
  },
  {
    // Measure — Blue
    header:  '#2563eb',
    descBg:  '#dbeafe',
    descFg:  '#1e3a8a',
    colBg:   '#eff6ff',
    chipBg:  '#bfdbfe',
    chipFg:  '#1e3a8a',
    divider: '#93c5fd',
  },
  {
    // Analyze — Teal
    header:  '#0d9488',
    descBg:  '#ccfbf1',
    descFg:  '#134e4a',
    colBg:   '#f0fdfa',
    chipBg:  '#99f6e4',
    chipFg:  '#134e4a',
    divider: '#5eead4',
  },
  {
    // Improve — Orange
    header:  '#ea580c',
    descBg:  '#ffedd5',
    descFg:  '#7c2d12',
    colBg:   '#fff7ed',
    chipBg:  '#fed7aa',
    chipFg:  '#7c2d12',
    divider: '#fdba74',
  },
  {
    // Control — Green
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
    paddingLeft:  index === 0          ? base : a,
    paddingRight: index === total - 1  ? base : a,
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
  const c = PHASE_COLORS[colorIdx]
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
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
interface DMAICCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

export function DMAICCanvas({ graph, onNodeEdit }: DMAICCanvasProps) {
  const grouped = useMemo<Map<NodeRole, StructuredNode[]>>(() => {
    const m = new Map<NodeRole, StructuredNode[]>(
      PHASES.map(p => [p.role, []])
    )
    graph.nodes.forEach(n => {
      m.get(n.role as NodeRole)?.push(n)
    })
    return m
  }, [graph.nodes])

  const total = PHASES.length

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
      <div style={{ minWidth: 720 }}>

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
          DMAIC — シックスシグマ改善サイクル
        </h2>

        {/* ── ② シェブロン型フェーズヘッダー ─────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {PHASES.map((ph, i) => {
            const c = PHASE_COLORS[i]
            return (
              <div
                key={ph.role}
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
                {ph.labelEn}
                <br />
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.88 }}>
                  {ph.labelJa}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── ③ フェーズ説明帯 ─────────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
          }}
        >
          {PHASES.map((ph, i) => {
            const c = PHASE_COLORS[i]
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

        {/* ── ④ ノードチップエリア ─────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${total}, 1fr)`,
            gap: 0,
            alignItems:          'start',
          }}
        >
          {PHASES.map((ph, i) => {
            const c     = PHASE_COLORS[i]
            const nodes = grouped.get(ph.role) ?? []
            return (
              <div
                key={ph.role}
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

期待される結果: エラーなし（または DMAIC 以外の既存エラーのみ）

---

### Task 2: CanvasRouter.tsx を更新する

**Files:**
- Modify: `src/components/organisms/canvas/CanvasRouter.tsx`

- [ ] **Step 1: import を追加する**

`CanvasRouter.tsx` の既存 import 群の末尾（`import { BSCCanvas } from './BSCCanvas'` の直後）に追記:

```typescript
import { DMAICCanvas } from './DMAICCanvas'
```

- [ ] **Step 2: matrixFrameworks セットから DMAIC を削除する**

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
  FrameworkType.DMAIC,
])
```

変更後:
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

- [ ] **Step 3: BSCCanvas 分岐の直後に DMAIC 専用分岐を追加する**

変更前（`if (graph.frameworkType === FrameworkType.BSC)` ブロックの後）:
```typescript
  if (graph.frameworkType === FrameworkType.BSC) {
    return withZoom(<BSCCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />)
  }

  // ── Pyramid / Tree 系（ZoomPan ラップ済み） ─────────────────────────────
```

変更後:
```typescript
  if (graph.frameworkType === FrameworkType.BSC) {
    return withZoom(<BSCCanvas graph={graph} onNodeEdit={onNodeEdit} onNodeMove={onNodeMove} />)
  }

  if (graph.frameworkType === FrameworkType.DMAIC) {
    return withZoom(<DMAICCanvas graph={graph} onNodeEdit={onNodeEdit} />)
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
git add src/components/organisms/canvas/DMAICCanvas.tsx src/components/organisms/canvas/CanvasRouter.tsx
git commit -m "feat: DMAICキャンバスを専用コンポーネントで実装（水平シェブロンフロー）"
```

---

### Task 3: 動作確認

**Files:** なし（読み取り専用確認）

- [ ] **Step 1: 開発サーバーを起動する**

```bash
npm run dev
```

- [ ] **Step 2: DMAIC フレームワークを選択して動作を確認する**

1. サイドバーから「DMAIC（シックスシグマ）」を選択
2. 以下のテキストを入力してフレームワークを適用:
   ```
   Define: 顧客クレーム率が高い問題を定義する。スコープは受注から納品まで。
   Measure: 現在のクレーム率は月平均8%。データ収集期間は3ヶ月。
   Analyze: 主因はピッキングミス（全体の60%）と配送遅延（25%）。
   Improve: ピッキングリストのデジタル化と配送ルート最適化を実施。
   Control: 週次KPIモニタリングと月次レビューで管理する。
   ```
3. 5列のシェブロンヘッダーが表示されることを確認（紫→青→ティール→オレンジ→緑）
4. 各フェーズに対応するチップが表示されることを確認
5. チップをダブルクリックして編集できることを確認
6. ZoomPan（ホイールズーム・ドラッグパン）が機能することを確認
