import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const vsmRules: FrameworkRuleSet = {
  framework: FrameworkType.VSM,
  rules: [
    { patterns: ['入力', '受注', '依頼', '原材料', 'インプット'], role: 'vsm_input', weight: 1.0 },
    {
      patterns: ['付加価値', '加工', '変換', '価値を生む', 'value add'],
      role: 'vsm_value_add',
      weight: 1.0,
    },
    { patterns: ['無駄', '待ち時間', '手戻り', '非効率', 'waste'], role: 'vsm_non_value', weight: 1.0 },
    { patterns: ['出力', '納品', '完成', 'アウトプット', 'output'], role: 'vsm_output', weight: 1.0 },
    {
      patterns: ['ボトルネック', '詰まり', '遅延', '滞留', '制約'],
      role: 'vsm_bottleneck',
      weight: 1.0,
    },
  ],
  defaultRole: 'unclassified',
}
