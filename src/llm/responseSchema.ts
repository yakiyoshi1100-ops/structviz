import type { NodeRole } from '@/types'

export interface RawGraphNode {
  id?: string
  role: NodeRole
  label: string
  description?: string
  parentId?: string | null
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface RawGraphEdge {
  id?: string
  source: string
  target: string
  label?: string
  type?: 'default' | 'hierarchy' | 'dependency' | 'association'
  metadata?: Record<string, unknown>
}

export interface RawGraphResponse {
  title: string
  nodes: RawGraphNode[]
  edges?: RawGraphEdge[]
  unclassified?: RawGraphNode[]
}

const nodeRoles = [
  'root',
  'branch',
  'leaf',
  'problem',
  'cause',
  'root-cause',
  'theme',
  'element',
  'fact',
  'definition',
  'goal',
  'approach',
  'action',
  'resource',
  'conclusion',
  'argument',
  'evidence',
  'category',
  'segment',
  'overlap',
  'gap',
  'company',
  'customer',
  'competitor',
  'strength',
  'weakness',
  'opportunity',
  'threat',
  'political',
  'economic',
  'social',
  'technological',
  'market-penetration',
  'market-development',
  'product-development',
  'diversification',
  'major-premise',
  'minor-premise',
  'major_premise',
  'minor_premise',
  'observation',
  'instance',
  'pattern',
  'generalization',
  'unclassified',
  'so_strategy',
  'wo_strategy',
  'st_strategy',
  'wt_strategy',
  'high_impact_easy',
  'high_impact_hard',
  'low_impact_easy',
  'low_impact_hard',
  'as_is',
  'to_be',
  'phenomenon',
  'issue',
  'measure',
  'flow_input',
  'flow_process',
  'flow_decision',
  'flow_output',
  'flow_storage',
  'flow_share',
  'eliminate',
  'combine',
  'rearrange',
  'simplify',
  'man',
  'machine',
  'material',
  'method',
  'quality',
  'cost',
  'delivery',
  'fishbone_root',
  'fishbone_man',
  'fishbone_machine',
  'fishbone_material',
  'fishbone_method',
  'fishbone_leaf',
  'issue_root',
  'issue_branch',
  'issue_leaf',
  'segmentation',
  'targeting',
  'positioning',
  'star',
  'cash_cow',
  'question_mark',
  'dog',
  'bsc_financial',
  'bsc_customer',
  'bsc_process',
  'bsc_learning',
  'kgi',
  'kpi',
  'kpi_action',
  'abc_high',
  'abc_mid',
  'abc_low',
  'raci_responsible',
  'raci_accountable',
  'raci_consulted',
  'raci_informed',
  'wbs_root',
  'wbs_phase',
  'wbs_task',
  'wbs_subtask',
  'did',
  'learned',
  'next',
  'spin_situation',
  'spin_problem',
  'spin_implication',
  'spin_need',
  'cj_awareness',
  'cj_consideration',
  'cj_purchase',
  'cj_retention',
  'cj_advocacy',
  'vsm_input',
  'vsm_value_add',
  'vsm_non_value',
  'vsm_output',
  'vsm_bottleneck',
  'dmaic_define',
  'dmaic_measure',
  'dmaic_analyze',
  'dmaic_improve',
  'dmaic_control',
] as const

const rawNodeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'label'],
  properties: {
    id: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: nodeRoles },
    label: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    parentId: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    metadata: { type: 'object', additionalProperties: true },
  },
} as const

export const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'nodes'],
  properties: {
    title: { type: 'string', minLength: 1 },
    nodes: {
      type: 'array',
      items: rawNodeSchema,
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['source', 'target'],
        properties: {
          id: { type: 'string', minLength: 1 },
          source: { type: 'string', minLength: 1 },
          target: { type: 'string', minLength: 1 },
          label: { type: 'string' },
          type: {
            type: 'string',
            enum: ['default', 'hierarchy', 'dependency', 'association'],
          },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
    unclassified: {
      type: 'array',
      items: rawNodeSchema,
    },
  },
} as const
