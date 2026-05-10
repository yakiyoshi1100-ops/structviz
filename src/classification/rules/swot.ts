import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const swotRules: FrameworkRuleSet = {
  framework: FrameworkType.SWOT,
  rules: [
    {
      patterns: ['強み', 'メリット', '優位', 'strength', '得意', '優れ', 'できる', '高い', '豊富', '実績', 'ブランド', '技術力', 'ノウハウ', '独自', '差別化', '競争優位'],
      role: 'strength',
      weight: 1.0,
    },
    {
      patterns: ['弱み', '弱点', '課題', 'weakness', '苦手', '劣っ', 'できない', '不足', '低い', '少ない', '遅い', '高コスト', '属人化', '依存', '脆弱', '未整備', '不明確'],
      role: 'weakness',
      weight: 1.0,
    },
    {
      patterns: ['機会', 'チャンス', '追い風', 'opportunity', '需要', '市場拡大', 'トレンド', '規制緩和', '新技術', 'AI', 'デジタル', '成長', '外部環境', '好機'],
      role: 'opportunity',
      weight: 1.0,
    },
    {
      patterns: ['脅威', 'リスク', '逆風', 'threat', '競合', '参入', '規制強化', '市場縮小', '価格競争', '人材不足', '景気悪化', 'コスト上昇', '代替品', '技術変化'],
      role: 'threat',
      weight: 1.0,
    },
  ],
  defaultRole: 'unclassified',
}
