import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const issueTreeRules: FrameworkRuleSet = {
  framework: FrameworkType.ISSUE_TREE,
  rules: [
    { patterns: ['〜すべきか', '〜か？', '問い', 'issue', 'べきか', 'どうすべき'], role: 'issue_root', weight: 1.0 },
    { patterns: ['〜はあるか', '〜か', '論点', '観点', 'サブ'], role: 'issue_branch', weight: 0.8 },
    { patterns: ['〜できるか', '〜は十分か', '確認', '検証', '評価'], role: 'issue_leaf', weight: 0.7 },
  ],
  defaultRole: 'issue_branch',
}
