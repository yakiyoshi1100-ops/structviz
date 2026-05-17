import { nanoid } from 'nanoid'

import { claudeClient } from '@/llm/claudeClient'
import {
  CROSS_LINK_SYSTEM_PROMPT,
  buildCrossLinkUserPrompt,
} from '@/llm/prompts/crossLinkPrompt'
import { useConfigStore, useCrossLinkStore } from '@/stores'
import type { CrossEdgeData, CrossLinkSlot } from '@/stores/crossLinkStore'

interface RawCrossLink {
  sourceSlot: number
  sourceNodeId: string
  targetSlot: number
  targetNodeId: string
  reason?: string
}

interface RawCrossLinkResponse {
  crossLinks: RawCrossLink[]
}

function isValidCrossLinkResponse(data: unknown): data is RawCrossLinkResponse {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (!Array.isArray(d['crossLinks'])) return false
  return d['crossLinks'].every(
    (item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>)['sourceSlot'] === 'number' &&
      typeof (item as Record<string, unknown>)['sourceNodeId'] === 'string' &&
      typeof (item as Record<string, unknown>)['targetSlot'] === 'number' &&
      typeof (item as Record<string, unknown>)['targetNodeId'] === 'string',
  )
}

function toCrossEdges(
  rawLinks: RawCrossLink[],
  slots: CrossLinkSlot[],
): CrossEdgeData[] {
  const edges: CrossEdgeData[] = []

  for (const link of rawLinks) {
    const srcSlot = slots[link.sourceSlot]
    const tgtSlot = slots[link.targetSlot]
    if (!srcSlot || !tgtSlot) continue
    if (link.sourceSlot === link.targetSlot) continue

    // ノードIDが実際に存在するか確認
    const srcNode = srcSlot.graph?.nodes.find((n) => n.id === link.sourceNodeId)
    const tgtNode = tgtSlot.graph?.nodes.find((n) => n.id === link.targetNodeId)
    if (!srcNode || !tgtNode) continue

    edges.push({
      id: nanoid(),
      sourceNodeId: `${srcSlot.id}@@${link.sourceNodeId}`,
      targetNodeId: `${tgtSlot.id}@@${link.targetNodeId}`,
      reason: link.reason,
    })
  }

  return edges
}

export function useAICrossLink() {
  const slots = useCrossLinkStore((s) => s.slots)
  const setSuggesting = useCrossLinkStore((s) => s.setSuggesting)
  const clearCrossEdges = useCrossLinkStore((s) => s.clearCrossEdges)
  const addCrossEdges = useCrossLinkStore((s) => s.addCrossEdges)
  const isSuggesting = useCrossLinkStore((s) => s.isSuggesting)

  const suggestCrossLinks = async () => {
    const activeSlots = slots.filter((s) => s.graph && s.graph.nodes.length > 0)
    if (activeSlots.length < 2) {
      console.warn('[AICrossLink] 2スロット以上グラフが必要です')
      return
    }

    const apiKey = useConfigStore.getState().apiKey
    if (!apiKey) {
      console.warn('[AICrossLink] APIキーが設定されていません')
      return
    }

    setSuggesting(true)
    clearCrossEdges()

    try {
      const data = await claudeClient({
        apiKey,
        systemPrompt: CROSS_LINK_SYSTEM_PROMPT,
        userPrompt: buildCrossLinkUserPrompt(slots),
      })

      if (!isValidCrossLinkResponse(data)) {
        console.error('[AICrossLink] レスポンス形式エラー:', data)
        return
      }

      const edges = toCrossEdges(data.crossLinks, slots)
      addCrossEdges(edges)
      console.log(`[AICrossLink] ${edges.length}件のクロスリンクを生成しました`)
    } catch (error) {
      console.error('[AICrossLink] エラー:', error)
    } finally {
      setSuggesting(false)
    }
  }

  return { suggestCrossLinks, isSuggesting }
}
