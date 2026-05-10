import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const stpRules: FrameworkRuleSet = {
  framework: FrameworkType.STP,
  rules: [
    { patterns: ['セグメント', '市場細分化', '顧客層', 'Segmentation', 'ターゲット層'], role: 'segmentation', weight: 1.0 },
    { patterns: ['ターゲット', '標的', '対象顧客', 'Targeting', '絞り込み'], role: 'targeting', weight: 1.0 },
    { patterns: ['ポジション', '立ち位置', '差別化', 'Positioning', '価値提案'], role: 'positioning', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
