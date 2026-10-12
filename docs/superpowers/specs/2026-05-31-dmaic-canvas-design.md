# DMAIC Canvas Design

**Date:** 2026-05-31  
**Framework:** DMAIC（シックスシグマ）  
**NodeRoles:** `dmaic_define`, `dmaic_measure`, `dmaic_analyze`, `dmaic_improve`, `dmaic_control`

## Overview

DMAICキャンバスを専用コンポーネントとして実装する。CustomerJourneyCanvas の水平フロー型レイアウトをベースに、DMAIC固有の5フェーズ・カラーへ置換する。

## Files

| Action | File |
|--------|------|
| 新規作成 | `src/components/organisms/canvas/DMAICCanvas.tsx` |
| 修正 | `src/components/organisms/canvas/CanvasRouter.tsx` |

## Phase Definitions

| Phase | NodeRole | Color | 日本語 |
|-------|----------|-------|--------|
| Define | `dmaic_define` | Purple (#7c3aed) | 定義 |
| Measure | `dmaic_measure` | Blue (#2563eb) | 測定 |
| Analyze | `dmaic_analyze` | Teal (#0d9488) | 分析 |
| Improve | `dmaic_improve` | Orange (#ea580c) | 改善 |
| Control | `dmaic_control` | Green (#16a34a) | 管理 |

## Component Structure

```
DMAICCanvas
├── PhaseHeader（シェブロン矢印付きヘッダー行）
│   └── 最後のフェーズのみ矢印なし
├── PhaseColumn × 5
│   ├── フェーズ説明テキスト（固定）
│   └── ItemChip（ダブルクリック編集可）× N
└── フッター説明テキスト
```

## Interactions

- ダブルクリック → インライン編集（`<input>` オーバーレイ、Enter/blur でコミット）
- `onNodeEdit` コールバックでラベル変更を sessionStore に反映
- ドラッグ&ドロップによるフェーズ間移動は実装しない（CustomerJourneyCanvas と同様）
- `ZoomPanCanvas` でラップ（CanvasRouter 側で処理）

## CanvasRouter Changes

1. `matrixFrameworks` セットから `FrameworkType.DMAIC` を削除
2. 専用分岐を追加（BSCCanvas の直後に挿入）:
   ```typescript
   if (graph.frameworkType === FrameworkType.DMAIC) {
     return withZoom(<DMAICCanvas graph={graph} onNodeEdit={onNodeEdit} />)
   }
   ```

## Props Interface

```typescript
interface DMAICCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}
```

`onNodeMove` は不要（ドラッグ移動なし）。

## Phase Description Texts

各フェーズの固定説明文（カードに表示）:

| Phase | 説明 |
|-------|------|
| Define | 問題・目標・スコープを明確にする |
| Measure | 現状のプロセスデータを収集・定量化する |
| Analyze | 根本原因を特定・検証する |
| Improve | 根本原因を排除する解決策を実施する |
| Control | 改善を維持・標準化し監視する |
