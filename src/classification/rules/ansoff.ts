import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const ansoffRules: FrameworkRuleSet = {
  framework: FrameworkType.ANSOFF,
  defaultRole: 'market-penetration',
  rules: [
    { role: 'market-penetration', weight: 0.6, patterns: ['既存市場', '既存顧客', '浸透', 'penetration'] },
    { role: 'market-development', weight: 0.6, patterns: ['新市場', '新規市場', '海外', 'market development'] },
    { role: 'product-development', weight: 0.6, patterns: ['新商品', '新製品', '機能追加', 'product development'] },
    { role: 'diversification', weight: 0.6, patterns: ['多角化', '新規事業', 'diversification'] },
  ],
}
