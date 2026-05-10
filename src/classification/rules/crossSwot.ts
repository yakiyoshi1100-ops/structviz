import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'

export const crossSwotRules: FrameworkRuleSet = {
  framework: FrameworkType.CROSS_SWOT,
  rules: [
    { patterns: [/強み.*機会/, 'SO', '積極戦略', '強みを活かして'], role: 'so_strategy', weight: 1.0 },
    { patterns: [/弱み.*機会/, 'WO', '弱みを克服', '改善して機会'], role: 'wo_strategy', weight: 1.0 },
    { patterns: [/強み.*脅威/, 'ST', '差別化', '強みで脅威に'], role: 'st_strategy', weight: 1.0 },
    { patterns: [/弱み.*脅威/, 'WT', '撤退', '縮小', '最小化'], role: 'wt_strategy', weight: 1.0 },
  ],
  defaultRole: 'unclassified',
}
