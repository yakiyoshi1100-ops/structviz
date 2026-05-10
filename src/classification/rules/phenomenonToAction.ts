import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const phenomenonToActionRules: FrameworkRuleSet = {
  framework: FrameworkType.PHENOMENON_TO_ACTION,
  rules: [
    {
      patterns: ['現象', '表面上', '見た目上', '症状として', 'クレームが多い', 'ミスが多い', 'が頻発', 'が繰り返'],
      role: 'phenomenon',
      weight: 1.0,
    },
    {
      patterns: ['本質的な問題', '本当の問題', '根本問題', 'そもそもの問題', '実態として'],
      role: 'problem',
      weight: 1.0,
    },
    {
      patterns: ['原因は', '要因は', 'なぜなら', 'せいで', 'が標準化されていない', 'が共有されていない', 'が明確でない', 'が属人化'],
      role: 'cause',
      weight: 1.0,
    },
    {
      patterns: ['解決すべき課題', '取り組むべき', 'が必要', 'を実現する必要', 'すべきテーマ'],
      role: 'issue',
      weight: 1.0,
    },
    {
      patterns: ['施策として', '対策として', '打ち手として', 'テンプレート化', 'チェックリスト化', 'DB化', '自動化', '標準化', 'AI活用'],
      role: 'measure',
      weight: 1.0,
    },
  ],
  defaultRole: 'phenomenon',
}
