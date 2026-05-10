import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const asIsToBeRules: FrameworkRuleSet = {
  framework: FrameworkType.AS_IS_TO_BE,
  rules: [
    { patterns: ['現状', '今は', '現在', 'as-is', 'as is', '今の'], role: 'as_is', weight: 1.0 },
    { patterns: ['理想', '目標', 'あるべき', 'to-be', 'to be', 'したい', 'なりたい'], role: 'to_be', weight: 1.0 },
    { patterns: ['差分', 'ギャップ', '不足', '足りない', 'gap'], role: 'gap', weight: 1.0 },
    { patterns: ['施策', '打ち手', '対策', 'アクション', 'action', '実施'], role: 'action', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
