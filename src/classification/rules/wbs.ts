import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const wbsRules: FrameworkRuleSet = {
  framework: FrameworkType.WBS,
  rules: [
    { patterns: ['プロジェクト', '全体', 'ゴール', '目的'], role: 'wbs_root', weight: 1.0 },
    { patterns: ['フェーズ', '工程', 'フェース', 'ステージ', '段階'], role: 'wbs_phase', weight: 0.9 },
    { patterns: ['タスク', '作業', '対応', '実施'], role: 'wbs_task', weight: 0.8 },
    { patterns: ['サブタスク', '詳細', '手順', 'ステップ'], role: 'wbs_subtask', weight: 0.7 },
  ],
  defaultRole: 'wbs_task',
}
