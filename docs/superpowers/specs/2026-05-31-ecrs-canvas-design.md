# ECRS Canvas Design

**Date:** 2026-05-31
**Framework:** ECRS分析
**NodeRoles:** `eliminate`, `combine`, `rearrange`, `simplify`

## Overview

ECRSキャンバスを専用コンポーネントとして実装する。DMAICCanvas と同じ水平シェブロンフロー型レイアウトをベースに、ECRS固有の4カテゴリ・カラーへ置換する。

## Files

| Action | File |
|--------|------|
| 新規作成 | `src/components/organisms/canvas/ECRSCanvas.tsx` |
| 修正 | `src/components/organisms/canvas/CanvasRouter.tsx` |

## Phase Definitions

| Category | NodeRole | Color | 説明 |
|----------|----------|-------|------|
| Eliminate（排除） | `eliminate` | Red (#dc2626) | 不要な作業を廃止する |
| Combine（結合） | `combine` | Blue (#2563eb) | 複数の作業をまとめる |
| Rearrange（再配置） | `rearrange` | Amber (#d97706) | 順序・担当を変える |
| Simplify（簡素化） | `simplify` | Green (#16a34a) | 作業を簡単にする |

## Component Structure

DMAICCanvas と同一の3層構造:

```
ECRSCanvas
├── タイトル見出し
├── PhaseHeader × 4（シェブロン矢印付き）
├── PhaseDescription × 4（固定説明帯）
├── ChipArea × 4（ノードチップ）
│   └── ItemChip（ダブルクリック編集・Escape キャンセル）
└── フッター説明テキスト
```

## Interactions

- ダブルクリック → インライン編集
- Enter / blur → コミット（`onNodeEdit(nodeId, { label })`）
- Escape → キャンセル（元ラベルに復帰）
- ドラッグ&ドロップなし
- `ZoomPanCanvas` でラップ（CanvasRouter 側）

## Props Interface

```typescript
interface ECRSCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}
```

## CanvasRouter Changes

1. `matrixFrameworks` セットから `FrameworkType.ECRS` を削除
2. DMAICCanvas 分岐の直後に追加:
   ```typescript
   if (graph.frameworkType === FrameworkType.ECRS) {
     return withZoom(<ECRSCanvas graph={graph} onNodeEdit={onNodeEdit} />)
   }
   ```
