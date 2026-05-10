import { nanoid } from 'nanoid'

import { claudeClient } from '@/llm/claudeClient'
import { SYSTEM_PROMPTS } from '@/llm/prompts/system'
import { renderUserTemplate } from '@/llm/prompts/userTemplate'
import type { RawGraphEdge, RawGraphNode, RawGraphResponse } from '@/llm/responseSchema'
import { validateAgainstSchema } from '@/llm/responseValidator'
import type { FrameworkGraph, FrameworkType, StructuredEdge, StructuredNode } from '@/types'
import type { ClassificationStrategy, ClassifyOptions } from './ClassificationStrategy'

function roleDepth(role: StructuredNode['role']): number {
  if (
    role === 'problem' ||
    role === 'theme' ||
    role === 'goal' ||
    role === 'conclusion' ||
    role === 'category'
  ) {
    return 0
  }

  if (
    role === 'root-cause' ||
    role === 'evidence' ||
    role === 'action' ||
    role === 'generalization'
  ) {
    return 2
  }

  return 1
}

function normalizeNode(node: RawGraphNode, index: number): StructuredNode {
  return {
    id: node.id ?? nanoid(),
    role: node.role,
    label: node.label,
    description: node.description,
    parentId: node.parentId ?? null,
    position: {
      x: index * 200,
      y: roleDepth(node.role) * 160,
    },
    data: {
      ...(node.metadata ?? {}),
      confidence: node.confidence ?? 1,
      source: 'ai',
    },
  }
}

function normalizeEdge(edge: RawGraphEdge, idSet: Set<string>): StructuredEdge | null {
  if (!idSet.has(edge.source) || !idSet.has(edge.target)) {
    return null
  }

  return {
    id: edge.id ?? nanoid(),
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: edge.type ?? 'hierarchy',
    data: {
      ...(edge.metadata ?? {}),
      source: 'ai',
    },
  }
}

function normalizeToGraph(
  response: RawGraphResponse,
  framework: FrameworkType,
  previousGraph?: FrameworkGraph,
): FrameworkGraph {
  const now = new Date().toISOString()
  const nodes = response.nodes.map(normalizeNode)
  const unclassified = response.unclassified?.map((node, index) =>
    normalizeNode(node, nodes.length + index),
  )
  const idSet = new Set([
    ...nodes.map((node) => node.id),
    ...(unclassified ?? []).map((node) => node.id),
  ])
  const edges = (response.edges ?? [])
    .map((edge) => normalizeEdge(edge, idSet))
    .filter((edge): edge is StructuredEdge => edge !== null)

  return {
    id: previousGraph?.id ?? nanoid(),
    frameworkType: framework,
    title: response.title,
    nodes,
    unclassified,
    edges,
    createdAt: previousGraph?.createdAt ?? now,
    updatedAt: now,
  }
}

export class AIStrategy implements ClassificationStrategy {
  readonly mode = 'ai'
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async classify(
    text: string,
    framework: FrameworkType,
    options?: ClassifyOptions,
  ): Promise<FrameworkGraph> {
    const data = await claudeClient({
      apiKey: this.apiKey,
      systemPrompt: SYSTEM_PROMPTS[framework],
      userPrompt: renderUserTemplate(text, options?.previousGraph),
      signal: options?.signal,
    })

    validateAgainstSchema(data)

    return normalizeToGraph(data, framework, options?.previousGraph)
  }
}
