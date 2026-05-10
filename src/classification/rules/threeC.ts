import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const threeCRules: FrameworkRuleSet = {
  framework: FrameworkType.THREE_C,
  rules: [
    {
      patterns: ['顧客', 'ユーザー', '客', 'customer', 'クライアント', '購買者', '消費者', 'エンドユーザー', '利用者', 'ニーズ', '要望', '課題感', '困っている', 'ペイン', '購買行動', '意思決定', '予算', '決裁'],
      role: 'customer',
      weight: 1.0,
    },
    {
      patterns: ['競合', 'ライバル', 'competitor', '他社', '競争相手', '同業', '同業他社', 'シェア', '市場シェア', '他のサービス', '代替', 'vs', '比較'],
      role: 'competitor',
      weight: 1.0,
    },
    {
      patterns: ['自社', '当社', 'company', '我々', 'うち', '弊社', '自分たち', 'われわれ', '私たち', 'チーム', '強み', '資源', 'リソース', '能力', 'ケイパビリティ'],
      role: 'company',
      weight: 1.0,
    },
  ],
  defaultRole: 'unclassified',
}
