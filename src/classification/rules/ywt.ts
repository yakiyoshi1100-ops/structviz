import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const ywtRules: FrameworkRuleSet = {
  framework: FrameworkType.YWT,
  rules: [
    { patterns: ['やったこと', '実施した', '取り組んだ', '行った', 'やった'], role: 'did', weight: 1.0 },
    { patterns: ['わかったこと', '気づき', '学び', '発見', '学んだ'], role: 'learned', weight: 1.0 },
    { patterns: ['次にやること', '今後', '次回', 'ネクスト', 'やる'], role: 'next', weight: 1.0 },
  ],
  defaultRole: 'did',
}
