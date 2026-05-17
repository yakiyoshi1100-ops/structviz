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

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return isNaN(n) ? null : n
  }
  return null
}

function isValidCrossLinkResponse(data: unknown): data is RawCrossLinkResponse {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (!Array.isArray(d['crossLinks'])) return false
  return d['crossLinks'].every((item: unknown) => {
    if (typeof item !== 'object' || item === null) return false
    const row = item as Record<string, unknown>
    return (
      toNumber(row['sourceSlot']) !== null &&
      typeof row['sourceNodeId'] === 'string' &&
      toNumber(row['targetSlot']) !== null &&
      typeof row['targetNodeId'] === 'string'
    )
  })
}

function normalizeCrossLinks(data: RawCrossLinkResponse): RawCrossLink[] {
  // Runtime values may be strings even if the type says number (Claude may return "0" instead of 0)
  return data.crossLinks.map((item) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceSlot: toNumber((item as any).sourceSlot)!,
    sourceNodeId: item.sourceNodeId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetSlot: toNumber((item as any).targetSlot)!,
    targetNodeId: item.targetNodeId,
    reason: item.reason,
  }))
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
  const setSuggestResult = useCrossLinkStore((s) => s.setSuggestResult)

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
    setSuggestResult(null)
    clearCrossEdges()

    try {
      const data = await claudeClient({
        apiKey,
        systemPrompt: CROSS_LINK_SYSTEM_PROMPT,
        userPrompt: buildCrossLinkUserPrompt(slots),
      })

      if (!isValidCrossLinkResponse(data)) {
        console.error('[AICrossLink] レスポンス形式エラー:', data)
        setSuggestResult({ count: 0, type: 'error', message: 'AIの応答形式が不正でした' })
        return
      }

      const normalized = normalizeCrossLinks(data)
      const edges = toCrossEdges(normalized, slots)
      addCrossEdges(edges)

      if (edges.length === 0) {
        setSuggestResult({ count: 0, type: 'empty', message: '関連するノードが見つかりませんでした' })
      } else {
        setSuggestResult({ count: edges.length, type: 'success', message: `${edges.length}件のクロスリンクを提案しました` })
      }
      console.log(`[AICrossLink] ${edges.length}件のクロスリンクを生成しました`)
    } catch (error) {
      console.error('[AICrossLink] エラー:', error)
      setSuggestResult({ count: 0, type: 'error', message: 'AI分析中にエラーが発生しました' })
    } finally {
      setSuggesting(false)
    }
  }

  return { suggestCrossLinks, isSuggesting }
}
