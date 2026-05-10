import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const raciRules: FrameworkRuleSet = {
  framework: FrameworkType.RACI,
  rules: [
    { patterns: ['実行', '担当', 'Responsible', '作業者', '実施者'], role: 'raci_responsible', weight: 1.0 },
    { patterns: ['説明責任', '承認', 'Accountable', '最終責任', 'オーナー'], role: 'raci_accountable', weight: 1.0 },
    { patterns: ['相談', '助言', 'Consulted', 'レビュー', '確認先'], role: 'raci_consulted', weight: 1.0 },
    { patterns: ['報告', '通知', 'Informed', '情報共有', '連絡先'], role: 'raci_informed', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
