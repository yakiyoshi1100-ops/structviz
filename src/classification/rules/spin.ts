import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const spinRules: FrameworkRuleSet = {
  framework: FrameworkType.SPIN,
  rules: [
    { patterns: ['状況', '現状', 'Situation', '背景', '環境'], role: 'spin_situation', weight: 1.0 },
    { patterns: ['問題', '課題', 'Problem', '困っている', 'ペイン'], role: 'spin_problem', weight: 1.0 },
    { patterns: ['影響', '示唆', 'Implication', 'このままでは', 'リスク'], role: 'spin_implication', weight: 1.0 },
    { patterns: ['解決', '提案', 'Need', '価値', 'ソリューション', '効果'], role: 'spin_need', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
