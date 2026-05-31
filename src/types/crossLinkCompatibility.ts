import { FrameworkType } from './framework'

/**
 * 対称隣接マップ。A に B が含まれれば B にも A が含まれる。
 * 選定基準：「同じ問題・対象を別の切り口で分析できるか」
 *
 * 対称性は手動で検証済み（全33種 × 全ネイバーを網羅確認）。
 * エントリを追加・変更する際は必ず逆方向のエントリも更新すること。
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
  // PEST は純粋な外部環境分析（政治・経済・社会・技術）のため、
  // 外部→内部への入力先である SWOT と 3C のみと接続する。
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
    FrameworkType.KPI, FrameworkType.QCD, FrameworkType.PPM,
  ],
  [FrameworkType.AS_IS_TO_BE]: [
    FrameworkType.PHENOMENON_TO_ACTION, FrameworkType.ECRS, FrameworkType.HOW_TREE,
    FrameworkType.VSM, FrameworkType.YWT, FrameworkType.BUSINESS_FLOW,
    FrameworkType.CUSTOMER_JOURNEY, FrameworkType.DMAIC,
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

  const otherSet = new Set(otherSelected)
  const result = new Set<FrameworkType>()
  for (const fw of all) {
    if (otherSet.has(fw)) continue
    if (compatSets.every((s) => s.has(fw))) {
      result.add(fw)
    }
  }
  return result
}
