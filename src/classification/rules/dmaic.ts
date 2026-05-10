import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const dmaicRules: FrameworkRuleSet = {
  framework: FrameworkType.DMAIC,
  rules: [
    { patterns: ['Define', '定義', '問題定義', 'スコープ', '目的'], role: 'dmaic_define', weight: 1.0 },
    {
      patterns: ['Measure', '測定', '現状計測', 'データ収集', '基準値'],
      role: 'dmaic_measure',
      weight: 1.0,
    },
    { patterns: ['Analyze', '分析', '原因分析', '要因', '統計'], role: 'dmaic_analyze', weight: 1.0 },
    {
      patterns: ['Improve', '改善', '解決策', '施策実施', '最適化'],
      role: 'dmaic_improve',
      weight: 1.0,
    },
    { patterns: ['Control', '管理', '標準化', '定着', '維持'], role: 'dmaic_control', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
