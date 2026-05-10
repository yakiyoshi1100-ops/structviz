import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const customerJourneyRules: FrameworkRuleSet = {
  framework: FrameworkType.CUSTOMER_JOURNEY,
  rules: [
    { patterns: ['認知', '知った', '発見', '広告', 'awareness'], role: 'cj_awareness', weight: 1.0 },
    {
      patterns: ['検討', '比較', '調査', '興味', 'consideration'],
      role: 'cj_consideration',
      weight: 1.0,
    },
    { patterns: ['購入', '契約', '申込', '決断', 'purchase'], role: 'cj_purchase', weight: 1.0 },
    { patterns: ['継続', 'リピート', '定着', '活用', 'retention'], role: 'cj_retention', weight: 1.0 },
    { patterns: ['推薦', '紹介', '口コミ', 'SNS', 'advocacy'], role: 'cj_advocacy', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
