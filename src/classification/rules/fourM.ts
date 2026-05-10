import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const fourMRules: FrameworkRuleSet = {
  framework: FrameworkType.FOUR_M,
  rules: [
    { patterns: ['人', '担当者', 'スタッフ', '作業者', '経験', 'Man', 'man', '教育', 'スキル'], role: 'man', weight: 1.0 },
    { patterns: ['設備', '機械', 'ツール', 'システム', 'Machine', 'PC', 'ソフト'], role: 'machine', weight: 1.0 },
    { patterns: ['材料', '情報', 'データ', 'Material', '資料', '入力データ', '原材料'], role: 'material', weight: 1.0 },
    { patterns: ['方法', '手順', '工程', 'Method', 'プロセス', '標準', 'やり方'], role: 'method', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
