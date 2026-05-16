import { RESPONSE_SCHEMA } from '@/llm/responseSchema'
import { FRAMEWORK_REGISTRY, FrameworkType } from '@/types'

const schemaText = JSON.stringify(RESPONSE_SCHEMA, null, 2)

const frameworkInstructions: Partial<Record<FrameworkType, string>> = {
  [FrameworkType.MECE]: [
    'テキストを「漏れなく・重複なく（MECE）」の観点で構造化してください。',
    '【最重要】カテゴリは必ず3〜6個以内にすること。7個以上は絶対に禁止。多い場合は上位概念でグループ化して減らすこと。',
    'roleの使い方（この定義のみ使用すること）:',
    '  root   = テーマ全体（1つだけ）',
    '  branch = MECEに分けた大分類カテゴリ（3〜6個厳守）',
    '  leaf   = 各カテゴリの具体的な要素（各branchの配下、1〜4個程度）',
    '注意: category/segment/overlap/gapは使わず、必ずroot/branch/leafを使うこと。',
    'カテゴリ間で重複がないか・全要素を網羅しているかを確認してから出力すること。',
  ].join('\n'),
  [FrameworkType.CROSS_SWOT]: [
    'SWOT分析のSO/WO/ST/WT戦略に分類してください。',
    'SO（強み×機会）: 積極的に攻める戦略',
    'WO（弱み×機会）: 弱みを克服して機会を掴む戦略',
    'ST（強み×脅威）: 強みで脅威に対抗する戦略',
    'WT（弱み×脅威）: リスクを最小化する戦略',
    'roleは so_strategy/wo_strategy/st_strategy/wt_strategy のいずれか。',
  ].join('\n'),
  [FrameworkType.PRIORITY_MATRIX]: [
    '施策・アイデアを効果の大きさ×実行のしやすさで4象限に分類してください。',
    'high_impact_easy: 効果大・実行しやすい（最優先）',
    'high_impact_hard: 効果大・実行しにくい（中長期テーマ）',
    'low_impact_easy: 効果小・実行しやすい（余力でやる）',
    'low_impact_hard: 効果小・実行しにくい（やらない）',
  ].join('\n'),
  [FrameworkType.AS_IS_TO_BE]: [
    '現状・理想・ギャップ・アクションに分類してください。',
    'as_is: 現状（今どうなっているか）',
    'to_be: 理想（どうなりたいか）',
    'gap: ギャップ（何が足りないか）',
    'action: 打ち手（何をするか）',
  ].join('\n'),
  [FrameworkType.PHENOMENON_TO_ACTION]: [
    'テキストを現象・問題・原因・課題・施策の5段階に分類してください。',
    'phenomenon: 表面に出ている困りごと・症状',
    'problem: 本当に困っていること（本質的な問題）',
    'cause: 問題が起きている理由・要因',
    'issue: 解決すべきテーマ・課題',
    'measure: 具体的な打ち手・施策・アクション',
  ].join('\n'),
  [FrameworkType.BUSINESS_FLOW]: [
    '業務テキストを以下の工程に分類してください。',
    'flow_input: 入力・受付・依頼受信',
    'flow_process: 処理・作業・計算・集計',
    'flow_decision: 判断・承認・決裁',
    'flow_output: 出力・作成・発行',
    'flow_storage: 保管・保存・記録',
    'flow_share: 共有・報告・連絡・通知',
  ].join('\n'),
  [FrameworkType.ECRS]: [
    '業務改善の観点でECRSに分類してください。',
    'eliminate: なくせないか（廃止・削除）',
    'combine: まとめられないか（統合・一本化）',
    'rearrange: 順番を変えられないか（工程変更）',
    'simplify: 簡単にできないか（自動化・テンプレート化）',
  ].join('\n'),
  [FrameworkType.FOUR_M]: [
    '4M分析（Man/Machine/Material/Method）に分類してください。',
    'man: 人・担当者・スキル・教育に関すること',
    'machine: 設備・ツール・システムに関すること',
    'material: 材料・情報・データに関すること',
    'method: 方法・手順・プロセス・標準に関すること',
  ].join('\n'),
  [FrameworkType.QCD]: [
    'QCD（Quality/Cost/Delivery）の観点で分類してください。',
    'quality: 品質・精度・ミス削減・クレーム対応に関すること',
    'cost: コスト・工数・人件費・費用削減に関すること',
    'delivery: 納期・スピード・時間短縮・期限に関すること',
  ].join('\n'),
  [FrameworkType.FISHBONE]: [
    '特性要因図（フィッシュボーン図）として分類してください。',
    'fishbone_root: 中心の問題・結果（最初に出てくる問題文）',
    'fishbone_man: 人・担当者・スキルに起因する要因',
    'fishbone_method: 方法・手順・ルールに起因する要因',
    'fishbone_machine: 設備・ツール・システムに起因する要因',
    'fishbone_material: 情報・データ・資料に起因する要因',
    'fishbone_leaf: 各カテゴリの詳細要因',
  ].join('\n'),
  [FrameworkType.ISSUE_TREE]: [
    'イシューツリーとして分類してください。',
    'issue_root: 最上位の問い・イシュー（〜すべきか？〜は可能か？）',
    'issue_branch: サブイシュー・論点（issue_rootを分解した問い）',
    'issue_leaf: 最も具体的な確認事項・検証ポイント',
  ].join('\n'),
  [FrameworkType.STP]:
    'STP分析として、segmentation（市場細分化）/ targeting（ターゲット選定）/ positioning（立ち位置・差別化）に分類してください。',
  [FrameworkType.PPM]:
    'PPM分析として、star（花形：高成長×高シェア）/ cash_cow（金のなる木：低成長×高シェア）/ question_mark（問題児：高成長×低シェア）/ dog（負け犬：低成長×低シェア）に分類してください。',
  [FrameworkType.BSC]:
    'BSCとして、bsc_financial（財務）/ bsc_customer（顧客）/ bsc_process（内部プロセス）/ bsc_learning（学習と成長）の4視点に分類してください。',
  [FrameworkType.KPI]:
    'KPI分析として、kgi（最終目標）/ kpi（中間指標）/ kpi_action（具体的施策）の階層で分類し、ツリー構造で出力してください。',
  [FrameworkType.ABC]:
    'ABC分析として、abc_high（A群：重点管理）/ abc_mid（B群：維持管理）/ abc_low（C群：見直し対象）に分類してください。',
  [FrameworkType.RACI]:
    'RACIチャートとして、raci_responsible（R:実行責任者）/ raci_accountable（A:説明責任者）/ raci_consulted（C:相談先）/ raci_informed（I:報告先）に分類してください。',
  [FrameworkType.WBS]:
    'WBSとして、wbs_root（プロジェクト全体）/ wbs_phase（フェーズ・工程）/ wbs_task（タスク）/ wbs_subtask（サブタスク）の階層で分類し、ツリー構造で出力してください。',
  [FrameworkType.YWT]:
    'YWT振り返りとして、did（やったこと）/ learned（わかったこと）/ next（次にやること）の3つに分類してください。',
  [FrameworkType.SPIN]:
    'SPIN話法として、spin_situation（状況質問）/ spin_problem（問題質問）/ spin_implication（示唆質問）/ spin_need（解決質問）に分類してください。',
  [FrameworkType.CUSTOMER_JOURNEY]:
    '顧客の体験を以下のフェーズに分類してください。\ncj_awareness（認知：知るきっかけ）/ cj_consideration（検討：比較・調査）/ cj_purchase（購入・契約）/ cj_retention（継続・定着・活用）/ cj_advocacy（推薦・口コミ・紹介）',
  [FrameworkType.VSM]:
    '業務・プロセスの流れを以下に分類してください。\nvsm_input（入力・受注）/ vsm_value_add（付加価値活動）/ vsm_non_value（非付加価値・無駄）/ vsm_output（出力・納品）/ vsm_bottleneck（ボトルネック・滞留）',
  [FrameworkType.DMAIC]:
    'シックスシグマのDMAICステップに分類してください。\ndmaic_define（Define：問題定義・スコープ設定）/ dmaic_measure（Measure：現状測定・データ収集）/ dmaic_analyze（Analyze：原因分析）/ dmaic_improve（Improve：改善策実施）/ dmaic_control（Control：管理・標準化・定着）',
}

function buildPrompt(framework: FrameworkType): string {
  const definition = FRAMEWORK_REGISTRY[framework]
  const roles = definition.nodeRoles.join(', ')
  const instruction =
    frameworkInstructions[framework] ??
    `${definition.label}として、入力テキストを最も適切なroleへ分類してください。`

  return [
    'あなたは経営/戦略コンサルタントです。',
    `${definition.label}を使って、入力テキストを構造化グラフへ分類してください。`,
    `フレームワーク説明: ${definition.description}`,
    `使用できるrole: ${roles}`,
    instruction,
    '分類に自信が低い要素はunclassifiedへ入れてください。',
    '必ずJSON形式のみで返すこと。説明文・マークダウン不要。',
    'レスポンスは次のJSON Schemaに厳密に従ってください。',
    schemaText,
  ].join('\n')
}

export const SYSTEM_PROMPTS: Record<FrameworkType, string> = {
  [FrameworkType.WHY_TREE]: buildPrompt(FrameworkType.WHY_TREE),
  [FrameworkType.WHAT_TREE]: buildPrompt(FrameworkType.WHAT_TREE),
  [FrameworkType.HOW_TREE]: buildPrompt(FrameworkType.HOW_TREE),
  [FrameworkType.PYRAMID]: buildPrompt(FrameworkType.PYRAMID),
  [FrameworkType.MECE]: buildPrompt(FrameworkType.MECE),
  [FrameworkType.THREE_C]: buildPrompt(FrameworkType.THREE_C),
  [FrameworkType.SWOT]: buildPrompt(FrameworkType.SWOT),
  [FrameworkType.PEST]: buildPrompt(FrameworkType.PEST),
  [FrameworkType.ANSOFF]: buildPrompt(FrameworkType.ANSOFF),
  [FrameworkType.DEDUCTION]: buildPrompt(FrameworkType.DEDUCTION),
  [FrameworkType.INDUCTION]: buildPrompt(FrameworkType.INDUCTION),
  [FrameworkType.CROSS_SWOT]: buildPrompt(FrameworkType.CROSS_SWOT),
  [FrameworkType.PRIORITY_MATRIX]: buildPrompt(FrameworkType.PRIORITY_MATRIX),
  [FrameworkType.AS_IS_TO_BE]: buildPrompt(FrameworkType.AS_IS_TO_BE),
  [FrameworkType.PHENOMENON_TO_ACTION]: buildPrompt(FrameworkType.PHENOMENON_TO_ACTION),
  [FrameworkType.BUSINESS_FLOW]: buildPrompt(FrameworkType.BUSINESS_FLOW),
  [FrameworkType.ECRS]: buildPrompt(FrameworkType.ECRS),
  [FrameworkType.FOUR_M]: buildPrompt(FrameworkType.FOUR_M),
  [FrameworkType.QCD]: buildPrompt(FrameworkType.QCD),
  [FrameworkType.FISHBONE]: buildPrompt(FrameworkType.FISHBONE),
  [FrameworkType.ISSUE_TREE]: buildPrompt(FrameworkType.ISSUE_TREE),
  [FrameworkType.STP]: buildPrompt(FrameworkType.STP),
  [FrameworkType.PPM]: buildPrompt(FrameworkType.PPM),
  [FrameworkType.BSC]: buildPrompt(FrameworkType.BSC),
  [FrameworkType.KPI]: buildPrompt(FrameworkType.KPI),
  [FrameworkType.ABC]: buildPrompt(FrameworkType.ABC),
  [FrameworkType.RACI]: buildPrompt(FrameworkType.RACI),
  [FrameworkType.WBS]: buildPrompt(FrameworkType.WBS),
  [FrameworkType.YWT]: buildPrompt(FrameworkType.YWT),
  [FrameworkType.SPIN]: buildPrompt(FrameworkType.SPIN),
  [FrameworkType.CUSTOMER_JOURNEY]: buildPrompt(FrameworkType.CUSTOMER_JOURNEY),
  [FrameworkType.VSM]: buildPrompt(FrameworkType.VSM),
  [FrameworkType.DMAIC]: buildPrompt(FrameworkType.DMAIC),
}
