import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const bscRules: FrameworkRuleSet = {
  framework: FrameworkType.BSC,
  rules: [
    { patterns: ['財務', '売上', '利益', 'ROI', 'コスト', '収益'], role: 'bsc_financial', weight: 1.0 },
    { patterns: ['顧客', '満足度', 'NPS', 'リテンション', '顧客視点'], role: 'bsc_customer', weight: 1.0 },
    { patterns: ['プロセス', '業務効率', '内部', 'オペレーション', '工程'], role: 'bsc_process', weight: 1.0 },
    { patterns: ['学習', '成長', '人材', 'スキル', '育成', 'イノベーション'], role: 'bsc_learning', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
