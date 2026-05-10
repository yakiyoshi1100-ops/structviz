import { nanoid } from 'nanoid'

import { ruleEngine } from '@/classification/ruleEngine'
import { ruleRegistry } from '@/classification/rules'
import { tokenize } from '@/classification/tokenizer'
import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredEdge, type StructuredNode } from '@/types'
import type { ClassificationStrategy, ClassifyOptions } from './ClassificationStrategy'

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Classification was aborted.', 'AbortError')
  }
}

function getRoleDepth(role: NodeRole): number {
  if (role === 'phenomenon') {
    return 0
  }

  if (role === 'problem' || role === 'theme' || role === 'goal' || role === 'branch') {
    return 1
  }

  if (role === 'cause' || role === 'root-cause' || role === 'evidence' || role === 'leaf') {
    return 2
  }

  if (role === 'issue') {
    return 3
  }

  if (role === 'measure') {
    return 4
  }

  return 1
}

function linkByDepth(nodes: StructuredNode[]): StructuredNode[] {
  const latestByDepth = new Map<number, string>()

  return nodes.map((node) => {
    const depth = getRoleDepth(node.role)
    let parentId: string | null = null

    for (let parentDepth = depth - 1; parentDepth >= 0; parentDepth -= 1) {
      const candidate = latestByDepth.get(parentDepth)

      if (candidate) {
        parentId = candidate
        break
      }
    }

    latestByDepth.set(depth, node.id)

    return {
      ...node,
      parentId,
    }
  })
}

export class StandaloneStrategy implements ClassificationStrategy {
  readonly mode = 'standalone'

  async classify(
    text: string,
    framework: FrameworkType,
    options?: ClassifyOptions,
  ): Promise<FrameworkGraph> {
    throwIfAborted(options?.signal)

    const sentences = tokenize(text)
    const ruleSet = ruleRegistry[framework]
    const results = ruleEngine.apply(sentences, ruleSet)
    const rootLabel = ruleSet.rootExtraction?.(sentences) ?? sentences[0] ?? 'Untitled graph'
    const now = new Date().toISOString()

    const allNodes = results.map<StructuredNode>((result, index) => {
      const node: StructuredNode = {
        id: nanoid(),
        role: result.role,
        label: result.sentence,
        parentId: null,
        position: {
          x: index * 200,
          y: 0,
        },
        data: {
          confidence: result.confidence,
          sentence: result.sentence,
        },
      }

      return {
        ...node,
        position: {
          x: index * 200,
          y: getRoleDepth(node.role) * 160,
        },
      }
    })

    const nodes = allNodes.filter(
      (node) => node.role !== 'unclassified' || Number(node.data?.confidence ?? 0) >= 0.5,
    )
    const unclassified = allNodes.filter(
      (node) => node.role === 'unclassified' && Number(node.data?.confidence ?? 0) < 0.5,
    )
    const rootNode = nodes[0]
    const linkedNodes =
      framework === FrameworkType.PHENOMENON_TO_ACTION
        ? linkByDepth(nodes)
        : rootNode
          ? nodes.map((node) => ({
              ...node,
              parentId: node.id === rootNode.id ? null : rootNode.id,
            }))
          : nodes

    const edges: StructuredEdge[] = linkedNodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: nanoid(),
        source: node.parentId as string,
        target: node.id,
        type: 'hierarchy',
      }))

    throwIfAborted(options?.signal)

    return {
      id: options?.previousGraph?.id ?? nanoid(),
      frameworkType: framework,
      title: rootLabel,
      nodes: linkedNodes,
      unclassified,
      edges,
      createdAt: options?.previousGraph?.createdAt ?? now,
      updatedAt: now,
    }
  }
}
