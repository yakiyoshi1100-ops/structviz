import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const ecrsRules: FrameworkRuleSet = {
  framework: FrameworkType.ECRS,
  rules: [
    { patterns: ['なくせ', '廃止', '削除', 'eliminate', '不要', 'やめる'], role: 'eliminate', weight: 1.0 },
    { patterns: ['まとめ', '統合', '一本化', 'combine', '合併', '集約'], role: 'combine', weight: 1.0 },
    { patterns: ['順番', '並び替え', '前後', 'rearrange', '工程変更', 'タイミング'], role: 'rearrange', weight: 1.0 },
    { patterns: ['簡単', '簡略', 'simplify', 'シンプル', 'テンプレ', '自動'], role: 'simplify', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
