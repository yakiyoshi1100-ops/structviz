import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const ppmRules: FrameworkRuleSet = {
  framework: FrameworkType.PPM,
  rules: [
    { patterns: ['花形', 'スター', /高成長.*高シェア/, 'star'], role: 'star', weight: 1.0 },
    { patterns: ['金のなる木', 'キャッシュカウ', /低成長.*高シェア/, 'cash cow'], role: 'cash_cow', weight: 1.0 },
    { patterns: ['問題児', /高成長.*低シェア/, 'question mark'], role: 'question_mark', weight: 1.0 },
    { patterns: ['負け犬', /低成長.*低シェア/, 'dog', '撤退'], role: 'dog', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
