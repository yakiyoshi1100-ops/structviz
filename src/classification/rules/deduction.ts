import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const deductionRules: FrameworkRuleSet = {
  framework: FrameworkType.DEDUCTION,
  rules: [
    {
      patterns: ['一般に', 'すべての', '常に', 'all', 'every', '〜は必ず', '一般的に', '通常', 'typically', 'の原則', '定義として', '法則として', 'という前提'],
      role: 'major_premise',
      weight: 1.0,
    },
    {
      patterns: ['この場合', '本件', '今回', '当該', 'in this case', 'この〜は', '対象の'],
      role: 'minor_premise',
      weight: 0.9,
    },
    {
      patterns: ['よって', 'したがって', 'ゆえに', 'therefore', 'つまり', '結論として', '以上から', 'であるから'],
      role: 'conclusion',
      weight: 1.0,
    },
  ],
  defaultRole: 'minor_premise',
}
