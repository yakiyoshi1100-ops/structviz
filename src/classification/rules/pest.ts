import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const pestRules: FrameworkRuleSet = {
  framework: FrameworkType.PEST,
  rules: [
    {
      patterns: ['政治', '法律', '規制', 'political', '政府', '行政', '法改正', '条例', '政策', '補助金', '助成金', '選挙', '政権', '国際関係', '外交', '税制'],
      role: 'political',
      weight: 1.0,
    },
    {
      patterns: ['経済', '景気', '為替', 'economic', 'GDP', '金利', 'インフレ', 'デフレ', '物価', '賃金', '雇用', '株価', '投資', '消費', '需要', '供給'],
      role: 'economic',
      weight: 1.0,
    },
    {
      patterns: ['社会', '人口', 'ライフスタイル', 'social', '文化', '少子高齢化', '働き方', '価値観', 'トレンド', '教育', '世代', 'Z世代', 'SNS', '意識変化'],
      role: 'social',
      weight: 1.0,
    },
    {
      patterns: ['技術', 'AI', 'IT', 'technological', 'デジタル', 'DX', 'IoT', 'クラウド', '自動化', 'ロボット', 'ChatGPT', 'LLM', '生成AI', 'イノベーション'],
      role: 'technological',
      weight: 1.0,
    },
  ],
  defaultRole: 'unclassified',
}
