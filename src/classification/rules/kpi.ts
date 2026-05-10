import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const kpiRules: FrameworkRuleSet = {
  framework: FrameworkType.KPI,
  rules: [
    { patterns: ['KGI', '最終目標', '経営目標', 'ゴール', '目指す姿'], role: 'kgi', weight: 1.0 },
    { patterns: ['KPI', '中間目標', '指標', '測定', 'メトリクス'], role: 'kpi', weight: 1.0 },
    { patterns: ['アクション', '施策', '行動', 'タスク', '具体的に'], role: 'kpi_action', weight: 0.8 },
  ],
  defaultRole: 'kpi',
}
