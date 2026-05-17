import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const inductionRules: FrameworkRuleSet = {
  framework: FrameworkType.INDUCTION,
  rules: [
    {
      patterns: ['事例', 'ケース', '実例', 'instance', 'の場合', 'によると', '調査の結果', 'Aでは', 'Bでは', 'Cでは'],
      role: 'observation',
      weight: 0.9,
    },
    {
      patterns: ['共通', 'パターン', '傾向', '規則性', 'どれも', '多くの場合', 'いずれも', 'という共通点', 'が見られる'],
      role: 'generalization',
      weight: 0.9,
    },
    {
      patterns: ['一般化', '〜と言える', 'generally', 'よって', 'まとめると', 'つまり'],
      role: 'generalization',
      weight: 1.0,
    },
  ],
  defaultRole: 'observation',
}
