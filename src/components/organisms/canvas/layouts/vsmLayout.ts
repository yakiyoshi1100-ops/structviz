import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

export const VSM_STREAM_ROLES = [
  'vsm_value_add',
  'vsm_non_value',
  'vsm_bottleneck',
] as const

export type VsmStreamRole = (typeof VSM_STREAM_ROLES)[number]

export const VSM_ENDPOINT_W = 168
export const VSM_ARROW_W = 36
export const VSM_PROCESS_W = 148
export const VSM_WAIT_W = 100
export const VSM_EMPTY_STREAM_W = 360

export function isVsmStreamRole(role: NodeRole): role is VsmStreamRole {
  return (VSM_STREAM_ROLES as readonly string[]).includes(role)
}

export interface VsmStream {
  input: StructuredNode[]
  stream: StructuredNode[]
  output: StructuredNode[]
}

export type VsmSegmentKind = 'input' | 'arrow' | 'process' | 'wait' | 'empty' | 'output'

export interface VsmSegment {
  kind: VsmSegmentKind
  width: number
  node?: StructuredNode
  /** リードタイム帯の色（arrow は未設定） */
  timelineColor?: string
}

/** 入力 → 工程ストリーム（出現順） → 出力 */
export function buildVsmStream(graph: FrameworkGraph): VsmStream {
  const order = new Map(graph.nodes.map((n, i) => [n.id, i]))

  const input = graph.nodes.filter((n) => n.role === 'vsm_input')
  const output = graph.nodes.filter((n) => n.role === 'vsm_output')
  const stream = graph.nodes
    .filter((n) => isVsmStreamRole(n.role))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  return { input, stream, output }
}

/** マップ列とリードタイム列を共有するセグメント列 */
export function buildVsmSegments(stream: VsmStream): VsmSegment[] {
  const segments: VsmSegment[] = []

  segments.push({ kind: 'input', width: VSM_ENDPOINT_W, timelineColor: '#c7d2fe' })
  segments.push({ kind: 'arrow', width: VSM_ARROW_W })

  if (stream.stream.length === 0) {
    segments.push({ kind: 'empty', width: VSM_EMPTY_STREAM_W, timelineColor: '#e2e8f0' })
  } else {
    stream.stream.forEach((node, index) => {
      const isProcess = node.role === 'vsm_value_add'
      const isBottleneck = node.role === 'vsm_bottleneck'
      segments.push({
        kind: isProcess ? 'process' : 'wait',
        width: isProcess ? VSM_PROCESS_W : VSM_WAIT_W,
        node,
        timelineColor: isProcess ? '#86efac' : isBottleneck ? '#fca5a5' : '#fde68a',
      })
      if (index < stream.stream.length - 1) {
        segments.push({ kind: 'arrow', width: VSM_ARROW_W })
      }
    })
  }

  segments.push({ kind: 'arrow', width: VSM_ARROW_W })
  segments.push({
    kind: 'output',
    width: VSM_ENDPOINT_W,
    timelineColor: stream.output.length > 0 ? '#93c5fd' : '#e0e7ff',
  })

  return segments
}

export function vsmGridTemplateColumns(segments: VsmSegment[]): string {
  return segments.map((s) => `${s.width}px`).join(' ')
}
