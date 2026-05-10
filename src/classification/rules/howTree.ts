import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const howTreeRules: FrameworkRuleSet = {
  framework: FrameworkType.HOW_TREE,
  rules: [
    {
      patterns: [
        'どう',
        'どうやって',
        'どのように',
        'how',
        'するには',
        'するために',
        'ためには',
        'に向けて',
        '達成するには',
        '実現するには',
        '改善するには',
      ],
      role: 'root',
      weight: 1.0,
    },
    {
      patterns: [
        '方法',
        '手段',
        '施策',
        'アプローチ',
        '戦略',
        'を導入',
        'を整備',
        'を構築',
        'を強化',
        'を改善',
        'を推進',
        'を策定',
        'を活用',
        'を設計',
        'を実施',
      ],
      role: 'branch',
      weight: 0.9,
    },
    {
      patterns: ['まず', '次に', 'ステップ', '手順', '具体的には', 'までに', '期限', '担当', '責任者', 'ツール', 'システム', 'テンプレート'],
      role: 'leaf',
      weight: 0.7,
    },
  ],
  defaultRole: 'leaf',
  rootExtraction: (sentences) => sentences[0] ?? 'Goal',
}
