import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const abcRules: FrameworkRuleSet = {
  framework: FrameworkType.ABC,
  rules: [
    { patterns: ['高収益', 'A群', '重点', '優先', '主力', '上位20'], role: 'abc_high', weight: 1.0 },
    { patterns: ['中収益', 'B群', '中間', '維持', '次点'], role: 'abc_mid', weight: 1.0 },
    { patterns: ['低収益', 'C群', '見直し', '撤退候補', '下位'], role: 'abc_low', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
