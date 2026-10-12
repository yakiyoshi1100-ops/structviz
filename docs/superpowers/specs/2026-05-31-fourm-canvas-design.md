# 4M Canvas Design

**Date:** 2026-05-31
**Framework:** 4M分析
**NodeRoles:** `man`, `machine`, `material`, `method`

## Overview

4M分析キャンバスを専用コンポーネントとして実装する。ECRSCanvas と同じ水平シェブロンフロー型レイアウトをベースに、4M固有のカテゴリ・カラーへ置換する。

## Files

| Action | File |
|--------|------|
| 新規作成 | `src/components/organisms/canvas/FourMCanvas.tsx` |
| 修正 | `src/components/organisms/canvas/CanvasRouter.tsx` |

## Category Definitions

| Category | NodeRole | Color | 説明 |
|----------|----------|-------|------|
| Man（人） | `man` | Violet (#7c3aed) | 技能・経験・態度・判断 |
| Machine（機械） | `machine` | Blue (#2563eb) | 設備・工具・精度・保全 |
| Material（材料） | `material` | Orange (#ea580c) | 原材料・部品・品質・供給 |
| Method（方法） | `method` | Teal (#0d9488) | 作業手順・標準・条件・設定 |

## Component Structure

ECRSCanvas と同一の3層構造:
- シェブロンヘッダー（英語名 + 日本語名）
- 説明帯
- チップエリア（ItemChip: ダブルクリック編集・Escape キャンセル）

## Props Interface

```typescript
interface FourMCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}
```

## CanvasRouter Changes

1. `matrixFrameworks` から `FrameworkType.FOUR_M` を削除
2. ECRS 分岐の直後に追加:
   ```typescript
   if (graph.frameworkType === FrameworkType.FOUR_M) {
     return withZoom(<FourMCanvas graph={graph} onNodeEdit={onNodeEdit} />)
   }
   ```
