import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const qcdRules: FrameworkRuleSet = {
  framework: FrameworkType.QCD,
  rules: [
    { patterns: ['品質', 'ミス', '精度', 'Quality', 'エラー', 'クレーム', '正確'], role: 'quality', weight: 1.0 },
    { patterns: ['コスト', '費用', '削減', 'Cost', '工数', '人件費', '予算'], role: 'cost', weight: 1.0 },
    { patterns: ['納期', 'スピード', '時間', 'Delivery', '期限', '短縮', '遅延'], role: 'delivery', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
