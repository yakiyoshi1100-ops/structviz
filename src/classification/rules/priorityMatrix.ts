import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const priorityMatrixRules: FrameworkRuleSet = {
  framework: FrameworkType.PRIORITY_MATRIX,
  rules: [
    { patterns: ['最優先', '今すぐ', /効果大.*簡単/, /すぐできる.*効果/], role: 'high_impact_easy', weight: 1.0 },
    { patterns: ['中長期', '重要だが難しい', /効果大.*難しい/, '戦略的'], role: 'high_impact_hard', weight: 1.0 },
    { patterns: ['余力', /効果小.*簡単/, '手が空いたら', 'ついでに'], role: 'low_impact_easy', weight: 1.0 },
    { patterns: ['やらない', /効果小.*難しい/, '後回し', '不要'], role: 'low_impact_hard', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
