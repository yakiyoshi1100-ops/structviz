import { FrameworkType } from '@/types'
import type { FrameworkRuleSet } from '../ruleEngine'
import { ansoffRules } from './ansoff'
import { asIsToBeRules } from './asIsToBe'
import { abcRules } from './abc'
import { bscRules } from './bsc'
import { businessFlowRules } from './businessFlow'
import { crossSwotRules } from './crossSwot'
import { customerJourneyRules } from './customerJourney'
import { deductionRules } from './deduction'
import { dmaicRules } from './dmaic'
import { ecrsRules } from './ecrs'
import { fishboneRules } from './fishbone'
import { fourMRules } from './fourM'
import { howTreeRules } from './howTree'
import { inductionRules } from './induction'
import { issueTreeRules } from './issueTree'
import { kpiRules } from './kpi'
import { meceRules } from './mece'
import { pestRules } from './pest'
import { phenomenonToActionRules } from './phenomenonToAction'
import { priorityMatrixRules } from './priorityMatrix'
import { pyramidRules } from './pyramid'
import { ppmRules } from './ppm'
import { qcdRules } from './qcd'
import { raciRules } from './raci'
import { spinRules } from './spin'
import { stpRules } from './stp'
import { swotRules } from './swot'
import { threeCRules } from './threeC'
import { vsmRules } from './vsm'
import { whatTreeRules } from './whatTree'
import { whyTreeRules } from './whyTree'
import { wbsRules } from './wbs'
import { ywtRules } from './ywt'

export const ruleRegistry: Record<FrameworkType, FrameworkRuleSet> = {
  [FrameworkType.WHY_TREE]: whyTreeRules,
  [FrameworkType.WHAT_TREE]: whatTreeRules,
  [FrameworkType.HOW_TREE]: howTreeRules,
  [FrameworkType.PYRAMID]: pyramidRules,
  [FrameworkType.MECE]: meceRules,
  [FrameworkType.THREE_C]: threeCRules,
  [FrameworkType.SWOT]: swotRules,
  [FrameworkType.PEST]: pestRules,
  [FrameworkType.ANSOFF]: ansoffRules,
  [FrameworkType.DEDUCTION]: deductionRules,
  [FrameworkType.INDUCTION]: inductionRules,
  [FrameworkType.CROSS_SWOT]: crossSwotRules,
  [FrameworkType.PRIORITY_MATRIX]: priorityMatrixRules,
  [FrameworkType.AS_IS_TO_BE]: asIsToBeRules,
  [FrameworkType.PHENOMENON_TO_ACTION]: phenomenonToActionRules,
  [FrameworkType.BUSINESS_FLOW]: businessFlowRules,
  [FrameworkType.ECRS]: ecrsRules,
  [FrameworkType.FOUR_M]: fourMRules,
  [FrameworkType.QCD]: qcdRules,
  [FrameworkType.FISHBONE]: fishboneRules,
  [FrameworkType.ISSUE_TREE]: issueTreeRules,
  [FrameworkType.STP]: stpRules,
  [FrameworkType.PPM]: ppmRules,
  [FrameworkType.BSC]: bscRules,
  [FrameworkType.KPI]: kpiRules,
  [FrameworkType.ABC]: abcRules,
  [FrameworkType.RACI]: raciRules,
  [FrameworkType.WBS]: wbsRules,
  [FrameworkType.YWT]: ywtRules,
  [FrameworkType.SPIN]: spinRules,
  [FrameworkType.CUSTOMER_JOURNEY]: customerJourneyRules,
  [FrameworkType.VSM]: vsmRules,
  [FrameworkType.DMAIC]: dmaicRules,
}

export * from './abc'
export * from './ansoff'
export * from './asIsToBe'
export * from './bsc'
export * from './businessFlow'
export * from './crossSwot'
export * from './customerJourney'
export * from './deduction'
export * from './dmaic'
export * from './ecrs'
export * from './fishbone'
export * from './fourM'
export * from './howTree'
export * from './induction'
export * from './issueTree'
export * from './kpi'
export * from './mece'
export * from './pest'
export * from './phenomenonToAction'
export * from './priorityMatrix'
export * from './pyramid'
export * from './ppm'
export * from './qcd'
export * from './raci'
export * from './spin'
export * from './stp'
export * from './swot'
export * from './threeC'
export * from './vsm'
export * from './whatTree'
export * from './whyTree'
export * from './wbs'
export * from './ywt'
