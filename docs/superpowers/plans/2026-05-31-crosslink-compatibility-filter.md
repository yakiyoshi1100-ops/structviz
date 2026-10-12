# Cross-Link Compatibility Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スロット1でフレームワークを選んだ後、スロット2・3の選択肢を互換フレームワークのみに絞り込む（非互換はグレーアウト）。既存選択が非互換になった場合は警告バナーを表示。

**Architecture:** 新規ファイル `src/types/crossLinkCompatibility.ts` に33種×対称隣接マップと絞り込みユーティリティ `getCompatibleFrameworks` を定義。`CrossLinkPanel.tsx` をスロットごとの互換セット計算・`<option disabled>` ・警告バナーに対応させる。CSS に警告スタイルを追加。

**Tech Stack:** TypeScript (const object, Set intersection), React (computed per-render), Zustand (read-only from store)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `src/types/crossLinkCompatibility.ts` | 33種の対称互換マップ + `getCompatibleFrameworks` |
| MODIFY | `src/components/organisms/CrossLinkPanel.tsx` | スロットごとの絞り込み・disabled オプション・警告バナー・スロット追加ボタン制御 |
| MODIFY | `src/App.css` | `.crosslink-slot__warning` スタイル追加 |

---

## Task 1: 互換マップファイルの作成

**Files:**
- Create: `src/types/crossLinkCompatibility.ts`

- [ ] **Step 1: ファイルを作成する**

`src/types/crossLinkCompatibility.ts` を以下の内容で作成する。

```typescript
import { FrameworkType } from './framework'

/**
 * 対称隣接マップ。A に B が含まれれば B にも A が含まれる。
 * 選定基準：「同じ問題・対象を別の切り口で分析できるか」
 */
export const CROSS_LINK_COMPAT: Readonly<
  Record<FrameworkType, ReadonlyArray<FrameworkType>>
> = {
  [FrameworkType.WHY_TREE]: [
    FrameworkType.WHAT_TREE, FrameworkType.HOW_TREE, FrameworkType.ISSUE_TREE,
    FrameworkType.PYRAMID, FrameworkType.FISHBONE, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.DEDUCTION, FrameworkType.INDUCTION, FrameworkType.DMAIC,
    FrameworkType.YWT, FrameworkType.FOUR_M,
  ],
  [FrameworkType.WHAT_TREE]: [
    FrameworkType.WHY_TREE, FrameworkType.HOW_TREE, FrameworkType.ISSUE_TREE,
    FrameworkType.MECE, FrameworkType.PYRAMID, FrameworkType.WBS,
  ],
  [FrameworkType.HOW_TREE]: [
    FrameworkType.WHY_TREE, FrameworkType.WHAT_TREE, FrameworkType.WBS,
    FrameworkType.ECRS, FrameworkType.PHENOMENON_TO_ACTION, FrameworkType.DMAIC,
    FrameworkType.AS_IS_TO_BE, FrameworkType.ISSUE_TREE, FrameworkType.CROSS_SWOT,
  ],
  [FrameworkType.PYRAMID]: [
    FrameworkType.WHY_TREE, FrameworkType.WHAT_TREE, FrameworkType.INDUCTION,
    FrameworkType.DEDUCTION, FrameworkType.MECE, FrameworkType.ISSUE_TREE,
  ],
  [FrameworkType.MECE]: [
    FrameworkType.WHAT_TREE, FrameworkType.PYRAMID, FrameworkType.SWOT,
    FrameworkType.THREE_C, FrameworkType.ISSUE_TREE, FrameworkType.INDUCTION,
  ],
  [FrameworkType.THREE_C]: [
    FrameworkType.SWOT, FrameworkType.PEST, FrameworkType.STP,
    FrameworkType.ANSOFF, FrameworkType.CROSS_SWOT, FrameworkType.MECE,
    FrameworkType.SPIN,
  ],
  [FrameworkType.SWOT]: [
    FrameworkType.THREE_C, FrameworkType.PEST, FrameworkType.CROSS_SWOT,
    FrameworkType.ANSOFF, FrameworkType.PRIORITY_MATRIX, FrameworkType.MECE,
  ],
  [FrameworkType.PEST]: [
    FrameworkType.SWOT, FrameworkType.THREE_C,
  ],
  [FrameworkType.ANSOFF]: [
    FrameworkType.THREE_C, FrameworkType.SWOT, FrameworkType.PPM, FrameworkType.STP,
  ],
  [FrameworkType.DEDUCTION]: [
    FrameworkType.WHY_TREE, FrameworkType.PYRAMID, FrameworkType.INDUCTION,
    FrameworkType.YWT,
  ],
  [FrameworkType.INDUCTION]: [
    FrameworkType.WHY_TREE, FrameworkType.PYRAMID, FrameworkType.DEDUCTION,
    FrameworkType.MECE, FrameworkType.YWT,
  ],
  [FrameworkType.CROSS_SWOT]: [
    FrameworkType.SWOT, FrameworkType.THREE_C, FrameworkType.PRIORITY_MATRIX,
    FrameworkType.HOW_TREE,
  ],
  [FrameworkType.PRIORITY_MATRIX]: [
    FrameworkType.SWOT, FrameworkType.CROSS_SWOT, FrameworkType.ABC,
    FrameworkType.ECRS, FrameworkType.ISSUE_TREE, FrameworkType.BSC,
    FrameworkType.KPI, FrameworkType.QCD,
  ],
  [FrameworkType.AS_IS_TO_BE]: [
    FrameworkType.PHENOMENON_TO_ACTION, FrameworkType.ECRS, FrameworkType.HOW_TREE,
    FrameworkType.VSM, FrameworkType.YWT, FrameworkType.BUSINESS_FLOW,
    FrameworkType.CUSTOMER_JOURNEY,
  ],
  [FrameworkType.PHENOMENON_TO_ACTION]: [
    FrameworkType.WHY_TREE, FrameworkType.HOW_TREE, FrameworkType.AS_IS_TO_BE,
    FrameworkType.FISHBONE, FrameworkType.DMAIC, FrameworkType.YWT,
    FrameworkType.SPIN, FrameworkType.CUSTOMER_JOURNEY,
  ],
  [FrameworkType.BUSINESS_FLOW]: [
    FrameworkType.VSM, FrameworkType.RACI, FrameworkType.AS_IS_TO_BE,
    FrameworkType.ECRS, FrameworkType.CUSTOMER_JOURNEY,
  ],
  [FrameworkType.ECRS]: [
    FrameworkType.HOW_TREE, FrameworkType.AS_IS_TO_BE, FrameworkType.BUSINESS_FLOW,
    FrameworkType.FOUR_M, FrameworkType.PRIORITY_MATRIX, FrameworkType.DMAIC,
    FrameworkType.VSM,
  ],
  [FrameworkType.FOUR_M]: [
    FrameworkType.FISHBONE, FrameworkType.ECRS, FrameworkType.DMAIC,
    FrameworkType.WHY_TREE,
  ],
  [FrameworkType.QCD]: [
    FrameworkType.BSC, FrameworkType.KPI, FrameworkType.PRIORITY_MATRIX,
    FrameworkType.DMAIC,
  ],
  [FrameworkType.FISHBONE]: [
    FrameworkType.WHY_TREE, FrameworkType.FOUR_M, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.DMAIC,
  ],
  [FrameworkType.ISSUE_TREE]: [
    FrameworkType.WHY_TREE, FrameworkType.WHAT_TREE, FrameworkType.PYRAMID,
    FrameworkType.MECE, FrameworkType.PRIORITY_MATRIX, FrameworkType.HOW_TREE,
    FrameworkType.ABC,
  ],
  [FrameworkType.STP]: [
    FrameworkType.THREE_C, FrameworkType.ANSOFF, FrameworkType.CUSTOMER_JOURNEY,
    FrameworkType.PPM,
  ],
  [FrameworkType.PPM]: [
    FrameworkType.ANSOFF, FrameworkType.STP, FrameworkType.ABC,
    FrameworkType.PRIORITY_MATRIX, FrameworkType.BSC,
  ],
  [FrameworkType.BSC]: [
    FrameworkType.KPI, FrameworkType.QCD, FrameworkType.PRIORITY_MATRIX,
    FrameworkType.PPM, FrameworkType.WBS, FrameworkType.DMAIC,
  ],
  [FrameworkType.KPI]: [
    FrameworkType.BSC, FrameworkType.QCD, FrameworkType.PRIORITY_MATRIX,
    FrameworkType.WBS, FrameworkType.DMAIC, FrameworkType.ABC,
  ],
  [FrameworkType.ABC]: [
    FrameworkType.PRIORITY_MATRIX, FrameworkType.PPM, FrameworkType.KPI,
    FrameworkType.ISSUE_TREE,
  ],
  [FrameworkType.RACI]: [
    FrameworkType.WBS, FrameworkType.BUSINESS_FLOW, FrameworkType.VSM,
  ],
  [FrameworkType.WBS]: [
    FrameworkType.HOW_TREE, FrameworkType.WHAT_TREE, FrameworkType.RACI,
    FrameworkType.BSC, FrameworkType.KPI,
  ],
  [FrameworkType.YWT]: [
    FrameworkType.WHY_TREE, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.AS_IS_TO_BE, FrameworkType.DEDUCTION, FrameworkType.INDUCTION,
  ],
  [FrameworkType.SPIN]: [
    FrameworkType.CUSTOMER_JOURNEY, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.THREE_C,
  ],
  [FrameworkType.CUSTOMER_JOURNEY]: [
    FrameworkType.STP, FrameworkType.SPIN, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.AS_IS_TO_BE, FrameworkType.BUSINESS_FLOW,
  ],
  [FrameworkType.VSM]: [
    FrameworkType.AS_IS_TO_BE, FrameworkType.BUSINESS_FLOW, FrameworkType.ECRS,
    FrameworkType.RACI, FrameworkType.DMAIC,
  ],
  [FrameworkType.DMAIC]: [
    FrameworkType.WHY_TREE, FrameworkType.HOW_TREE, FrameworkType.FISHBONE,
    FrameworkType.FOUR_M, FrameworkType.ECRS, FrameworkType.PHENOMENON_TO_ACTION,
    FrameworkType.QCD, FrameworkType.BSC, FrameworkType.KPI,
    FrameworkType.VSM, FrameworkType.AS_IS_TO_BE,
  ],
}

/**
 * `otherSelected` に含まれる全フレームワークと互換する FrameworkType の Set を返す。
 * otherSelected が空の場合は全種を返す（制約なし）。
 * otherSelected 自身は結果に含まれない。
 */
export function getCompatibleFrameworks(
  otherSelected: FrameworkType[],
): Set<FrameworkType> {
  const all = Object.values(FrameworkType) as FrameworkType[]

  if (otherSelected.length === 0) {
    return new Set(all)
  }

  const compatSets = otherSelected.map((fw) => new Set(CROSS_LINK_COMPAT[fw]))

  const result = new Set<FrameworkType>()
  for (const fw of all) {
    if (otherSelected.includes(fw)) continue
    if (compatSets.every((s) => s.has(fw))) {
      result.add(fw)
    }
  }
  return result
}
```

- [ ] **Step 2: 型チェックを実行して問題がないことを確認する**

```bash
cd structviz && npx tsc --noEmit
```

期待される出力: エラーなし（何も表示されない）

- [ ] **Step 3: コミットする**

```bash
git add src/types/crossLinkCompatibility.ts
git commit -m "feat: add cross-link framework compatibility map and getCompatibleFrameworks"
```

---

## Task 2: CrossLinkPanel にスロット互換フィルタリングを実装する

**Files:**
- Modify: `src/components/organisms/CrossLinkPanel.tsx`

現在の `<select>` ブロック（lines 97–117）を拡張する。スロットごとに「他スロットの選択済みフレームワーク」から互換セットを計算し、`<option disabled>` と警告バナーを追加する。

- [ ] **Step 1: import を追加する**

ファイル先頭の import 行を以下に変更する（既存 import の直後に追加）:

```typescript
import { useAICrossLink } from '@/hooks/useAICrossLink'
import { useCrossLinkClassify } from '@/hooks/useCrossLinkClassify'
import { useConfigStore, useCrossLinkStore } from '@/stores'
import { FRAMEWORK_REGISTRY, FrameworkType } from '@/types'
import { getCompatibleFrameworks } from '@/types/crossLinkCompatibility'
```

- [ ] **Step 2: コンポーネント内にスロット互換計算ヘルパーを追加する**

`const isAnyLoading = ...` の直前に以下を挿入する:

```typescript
  // 指定スロット以外のフレームワーク選択から互換セットを算出
  const compatibleForSlot = (slotId: string): Set<FrameworkType> => {
    const others = slots
      .filter((s) => s.id !== slotId && s.frameworkType !== null)
      .map((s) => s.frameworkType as FrameworkType)
    return getCompatibleFrameworks(others)
  }

  // スロット追加ボタン: 全スロット選択済み時に3つ目の互換候補がなければ無効化
  const canAddSlot = (() => {
    if (slots.length >= 3) return false
    const allSelected = slots
      .filter((s) => s.frameworkType !== null)
      .map((s) => s.frameworkType as FrameworkType)
    if (allSelected.length < 2) return true
    return getCompatibleFrameworks(allSelected).size > 0
  })()
```

- [ ] **Step 3: `<select>` ブロックをスロットごとの互換フィルタに書き換える**

現在の `<select>` ブロック（`<option value="">フレームワークを選択</option>` を含む全体）を以下に置き換える:

```tsx
            {(() => {
              const compat = compatibleForSlot(slot.id)
              const constrained = slots.some(
                (s) => s.id !== slot.id && s.frameworkType !== null,
              )
              const isIncompat =
                slot.frameworkType !== null &&
                constrained &&
                !compat.has(slot.frameworkType)
              return (
                <>
                  {isIncompat && (
                    <div className="crosslink-slot__warning">
                      ⚠ この組み合わせは非互換です
                    </div>
                  )}
                  <select
                    className="crosslink-slot__select"
                    value={slot.frameworkType ?? ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSlotFramework(slot.id, e.target.value as FrameworkType)
                      }
                    }}
                  >
                    <option value="">フレームワークを選択</option>
                    {FRAMEWORK_OPTIONS.map((opt) => {
                      const disabled =
                        constrained && !compat.has(opt.value as FrameworkType)
                      return (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={disabled}
                        >
                          {opt.label}
                        </option>
                      )
                    })}
                  </select>
                </>
              )
            })()}
```

- [ ] **Step 4: スロット追加ボタンの条件を `canAddSlot` に変更する**

```tsx
        {/* スロット追加ボタン */}
        {canAddSlot && (
          <button type="button" className="crosslink-add-slot" onClick={addSlot}>
            ＋
          </button>
        )}
```

(`slots.length < 3` を `canAddSlot` に変えるだけ)

- [ ] **Step 5: 型チェックを実行する**

```bash
npx tsc --noEmit
```

期待される出力: エラーなし

- [ ] **Step 6: コミットする**

```bash
git add src/components/organisms/CrossLinkPanel.tsx
git commit -m "feat: filter cross-link slot options by framework compatibility"
```

---

## Task 3: 警告バナーの CSS を追加する

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: `.crosslink-slot__warning` スタイルをクロスリンクセクションに追加する**

`src/App.css` のクロスリンクレイアウトセクション末尾（`.crosslink-canvas-area` の直後）に追加する:

```css
.crosslink-slot__warning {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-size: var(--font-size-xs);
  font-weight: 500;
  margin-bottom: 4px;
}
```

- [ ] **Step 2: 型チェックとビルドを実行して最終確認する**

```bash
npx tsc --noEmit && npm run build
```

期待される出力: エラーなし・`dist/` にバンドルが生成される

- [ ] **Step 3: コミットする**

```bash
git add src/App.css
git commit -m "style: add warning style for incompatible cross-link slot selection"
```

---

## 動作確認チェックリスト

実装完了後、ブラウザで以下を確認する:

1. **スロット1 = WHY_TREE 選択** → スロット2に WHAT_TREE, HOW_TREE, FISHBONE 等が有効、SWOT, THREE_C, STP 等がグレーアウト
2. **スロット1 = SWOT, スロット2 = THREE_C 選択** → スロット追加ボタンが有効・スロット3に PEST, CROSS_SWOT, ANSOFF, MECE のみ有効
3. **スロット1 = RACI, スロット2 = WBS 選択** → スロット追加ボタンが非表示（互換3rd候補なし）
4. **スロット1変更でスロット2が非互換になった場合** → スロット2に赤い警告バナー表示、スロット2の選択はリセットされない
5. **スロット1のみ選択・スロット2未選択** → スロット2の全オプションが有効（制約なし）
