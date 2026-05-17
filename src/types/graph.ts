import type { FrameworkType } from './framework'

export type NodeRole =
  | 'root'
  | 'branch'
  | 'leaf'
  | 'problem'
  | 'cause'
  | 'root-cause'
  | 'theme'
  | 'element'
  | 'fact'
  | 'definition'
  | 'goal'
  | 'approach'
  | 'action'
  | 'resource'
  | 'conclusion'
  | 'argument'
  | 'evidence'
  | 'category'
  | 'segment'
  | 'overlap'
  | 'gap'
  | 'company'
  | 'customer'
  | 'competitor'
  | 'strength'
  | 'weakness'
  | 'opportunity'
  | 'threat'
  | 'political'
  | 'economic'
  | 'social'
  | 'technological'
  | 'market-penetration'
  | 'market-development'
  | 'product-development'
  | 'diversification'
  | 'major_premise'
  | 'minor_premise'
  | 'observation'
  | 'instance'
  | 'pattern'
  | 'generalization'
  | 'unclassified'
  | 'so_strategy'
  | 'wo_strategy'
  | 'st_strategy'
  | 'wt_strategy'
  | 'high_impact_easy'
  | 'high_impact_hard'
  | 'low_impact_easy'
  | 'low_impact_hard'
  | 'as_is'
  | 'to_be'
  | 'phenomenon'
  | 'issue'
  | 'measure'
  | 'flow_input'
  | 'flow_process'
  | 'flow_decision'
  | 'flow_output'
  | 'flow_storage'
  | 'flow_share'
  | 'eliminate'
  | 'combine'
  | 'rearrange'
  | 'simplify'
  | 'man'
  | 'machine'
  | 'material'
  | 'method'
  | 'quality'
  | 'cost'
  | 'delivery'
  | 'fishbone_root'
  | 'fishbone_man'
  | 'fishbone_machine'
  | 'fishbone_material'
  | 'fishbone_method'
  | 'fishbone_leaf'
  | 'issue_root'
  | 'issue_branch'
  | 'issue_leaf'
  | 'segmentation'
  | 'targeting'
  | 'positioning'
  | 'star'
  | 'cash_cow'
  | 'question_mark'
  | 'dog'
  | 'bsc_financial'
  | 'bsc_customer'
  | 'bsc_process'
  | 'bsc_learning'
  | 'kgi'
  | 'kpi'
  | 'kpi_action'
  | 'abc_high'
  | 'abc_mid'
  | 'abc_low'
  | 'raci_responsible'
  | 'raci_accountable'
  | 'raci_consulted'
  | 'raci_informed'
  | 'wbs_root'
  | 'wbs_phase'
  | 'wbs_task'
  | 'wbs_subtask'
  | 'did'
  | 'learned'
  | 'next'
  | 'spin_situation'
  | 'spin_problem'
  | 'spin_implication'
  | 'spin_need'
  | 'cj_awareness'
  | 'cj_consideration'
  | 'cj_purchase'
  | 'cj_retention'
  | 'cj_advocacy'
  | 'vsm_input'
  | 'vsm_value_add'
  | 'vsm_non_value'
  | 'vsm_output'
  | 'vsm_bottleneck'
  | 'dmaic_define'
  | 'dmaic_measure'
  | 'dmaic_analyze'
  | 'dmaic_improve'
  | 'dmaic_control'

export interface StructuredNode {
  id: string
  role: NodeRole
  label: string
  description?: string
  parentId?: string | null
  position: {
    x: number
    y: number
  }
  data?: Record<string, unknown>
}

export interface StructuredEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: 'default' | 'hierarchy' | 'dependency' | 'association'
  data?: Record<string, unknown>
}

export interface FrameworkGraph {
  id: string
  frameworkType: FrameworkType
  title: string
  nodes: StructuredNode[]
  unclassified?: StructuredNode[]
  edges: StructuredEdge[]
  createdAt: string
  updatedAt: string
}
