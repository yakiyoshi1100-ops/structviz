import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const fishboneRules: FrameworkRuleSet = {
  framework: FrameworkType.FISHBONE,
  rules: [
    { patterns: ['問題', 'クレーム', '不具合', '課題', 'トラブル'], role: 'fishbone_root', weight: 1.0 },
    { patterns: ['人', '担当者', '教育', '経験', 'スキル'], role: 'fishbone_man', weight: 0.9 },
    { patterns: ['方法', '手順', '標準書', 'プロセス', 'ルール'], role: 'fishbone_method', weight: 0.9 },
    { patterns: ['設備', 'ツール', 'システム', 'PC', 'ソフト'], role: 'fishbone_machine', weight: 0.9 },
    { patterns: ['情報', 'データ', '資料', '共有', '伝達'], role: 'fishbone_material', weight: 0.9 },
  ],
  defaultRole: 'fishbone_leaf',
}
