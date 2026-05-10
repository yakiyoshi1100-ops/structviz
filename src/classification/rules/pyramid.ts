import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const pyramidRules: FrameworkRuleSet = {
  framework: FrameworkType.PYRAMID,
  rules: [
    {
      patterns: [
        '結論',
        'つまり',
        'よって',
        'したがって',
        'ゆえに',
        '以上から',
        'まとめると',
        '要するに',
        'therefore',
        'すべきだ',
        'べきである',
        '必要だ',
        '重要だ',
        '提言',
      ],
      role: 'root',
      weight: 1.0,
    },
    {
      patterns: ['根拠', 'なぜなら', 'その理由は', '理由として', '第一に', '第二に', '第三に', 'また', 'さらに', '加えて', '一方で'],
      role: 'branch',
      weight: 0.9,
    },
    {
      patterns: ['データ', '数値', '実績', '事例', '調査', 'によると', 'によれば', '統計', 'パーセント', '件', '回', '億円', '万件', '%'],
      role: 'leaf',
      weight: 0.8,
    },
  ],
  defaultRole: 'branch',
  rootExtraction: (sentences) => sentences[0] ?? 'Conclusion',
}
