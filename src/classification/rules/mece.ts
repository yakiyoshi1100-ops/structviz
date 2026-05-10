import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const meceRules: FrameworkRuleSet = {
  framework: FrameworkType.MECE,
  rules: [
    {
      patterns: ['全体', 'テーマ', '対象', 'の整理', 'の分類', 'について整理', 'に関して整理', '漏れなく', '重複なく'],
      role: 'root',
      weight: 1.0,
    },
    {
      patterns: ['カテゴリ', '分類', '区分', 'グループ', '種類', '観点', '視点', '軸', '側面', '領域', 'の問題', 'の課題', 'の観点'],
      role: 'branch',
      weight: 0.9,
    },
    {
      patterns: ['項目', '事例', '詳細', '内容', 'たとえば', '具体的には'],
      role: 'leaf',
      weight: 0.6,
    },
  ],
  defaultRole: 'branch',
}
