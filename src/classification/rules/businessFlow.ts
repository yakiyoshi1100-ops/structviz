import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const businessFlowRules: FrameworkRuleSet = {
  framework: FrameworkType.BUSINESS_FLOW,
  rules: [
    { patterns: ['入力', '受付', '依頼', 'インプット', '受信'], role: 'flow_input', weight: 1.0 },
    { patterns: ['処理', '作業', '計算', '集計', '変換', '確認'], role: 'flow_process', weight: 1.0 },
    { patterns: ['判断', '決裁', '承認', '判定', '可否', '決定'], role: 'flow_decision', weight: 1.0 },
    { patterns: ['出力', '作成', '発行', 'アウトプット', '提出', '送付'], role: 'flow_output', weight: 1.0 },
    { patterns: ['保管', '保存', 'ファイリング', 'アーカイブ', '記録'], role: 'flow_storage', weight: 1.0 },
    { patterns: ['共有', '連絡', '報告', '通知', '展開', '周知'], role: 'flow_share', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
