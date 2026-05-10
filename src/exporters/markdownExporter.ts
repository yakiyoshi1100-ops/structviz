import { FrameworkType, type FrameworkGraph, type StructuredNode } from '@/types'
import { downloadBlob } from './pngExporter'

const matrixFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.THREE_C,
  FrameworkType.PEST,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.AS_IS_TO_BE,
  FrameworkType.BUSINESS_FLOW,
  FrameworkType.ECRS,
  FrameworkType.FOUR_M,
  FrameworkType.QCD,
  FrameworkType.STP,
  FrameworkType.PPM,
  FrameworkType.BSC,
  FrameworkType.ABC,
  FrameworkType.RACI,
  FrameworkType.YWT,
  FrameworkType.SPIN,
  FrameworkType.CUSTOMER_JOURNEY,
  FrameworkType.VSM,
  FrameworkType.DMAIC,
])

function buildChildren(nodes: StructuredNode[], parentId: string | null, depth = 0): string[] {
  return nodes
    .filter((node) => (node.parentId ?? null) === parentId)
    .flatMap((node) => [
      `${'  '.repeat(depth)}- ${node.label}`,
      ...buildChildren(nodes, node.id, depth + 1),
    ])
}

export function exportMarkdown(graph: FrameworkGraph): string {
  if (matrixFrameworks.has(graph.frameworkType)) {
    const roles = Array.from(new Set(graph.nodes.map((node) => node.role)))
    return [
      `# ${graph.title}`,
      '',
      ...roles.flatMap((role) => [
        `## ${role}`,
        '',
        ...graph.nodes.filter((node) => node.role === role).map((node) => `- ${node.label}`),
        '',
      ]),
    ].join('\n')
  }

  const root = graph.nodes.find((node) => !node.parentId) ?? graph.nodes[0]
  const children = root ? buildChildren(graph.nodes, root.id) : []

  return [`# ${root?.label ?? graph.title}`, '', ...children].join('\n')
}

export function downloadMarkdown(graph: FrameworkGraph, filename: string): void {
  downloadBlob(new Blob([exportMarkdown(graph)], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`)
}
