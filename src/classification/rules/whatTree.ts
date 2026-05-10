import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const whatTreeRules: FrameworkRuleSet = {
  framework: FrameworkType.WHAT_TREE,
  rules: [
    {
      patterns: ['とは', 'とは何か', 'の定義', 'の概要', 'の全体像', 'について', 'に関して', '全体像', 'what'],
      role: 'root',
      weight: 1.0,
    },
    {
      patterns: [
        '構成',
        '内訳',
        '要素',
        '種類',
        '分類',
        'カテゴリ',
        '領域',
        '分野',
        '部門',
        '観点',
        'から成る',
        'で構成',
        'に分けられる',
        'がある',
      ],
      role: 'branch',
      weight: 0.9,
    },
    {
      patterns: ['具体的には', 'たとえば', '例えば', '特に', '主に', 'のうち', 'の一つ', 'の例', '個別', '各'],
      role: 'leaf',
      weight: 0.7,
    },
  ],
  defaultRole: 'leaf',
  rootExtraction: (sentences) => sentences[0] ?? 'Theme',
}
