import { FRAMEWORK_REGISTRY } from '@/types'
import type { CrossLinkSlot } from '@/stores/crossLinkStore'

export const CROSS_LINK_SYSTEM_PROMPT = [
  'あなたはフレームワーク分析の専門家です。',
  '複数のフレームワーク分析結果を横断して、論理的・意味的に関連するノードのペアを特定してください。',
  '',
  '【目的】',
  '異なるフレームワーク間のノードを接続し、分析の洞察を深める。',
  'ユーザーが手動で気づきにくい「フレームワーク間のつながり」を発見する。',
  '',
  '【クロスリンク選定基準】',
  '- 同じ概念・テーマを異なる視点から表しているノード（例: Whatの「売上低下」 ↔ Whyの「顧客離れ」）',
  '- 因果関係のあるノード（Aの原因がB・Bの結果がA）',
  '- 対応関係のあるノード（問題 ↔ 解決策・現状 ↔ 理想）',
  '- 補完関係のあるノード（視点が違うが同じ課題を指している）',
  '',
  '【ルール】',
  '- 同じスロット内のノード同士は絶対に含めない',
  '- 提案数は3〜8ペアが理想（多すぎると価値が下がる）',
  '- reasonは日本語15文字以内で端的に',
  '- 必ずJSON形式のみで返すこと。説明文・マークダウン不要',
  '',
  '出力スキーマ:',
  JSON.stringify(
    {
      crossLinks: [
        {
          sourceSlot: '<スロット番号 0始まり>',
          sourceNodeId: '<ノードID（入力で示したIDそのまま）>',
          targetSlot: '<スロット番号 0始まり>',
          targetNodeId: '<ノードID（入力で示したIDそのまま）>',
          reason: '<関連理由 15文字以内>',
        },
      ],
    },
    null,
    2,
  ),
].join('\n')

export function buildCrossLinkUserPrompt(slots: CrossLinkSlot[]): string {
  const slotDescriptions = slots
    .map((slot, index) => {
      if (!slot.graph || !slot.frameworkType || slot.graph.nodes.length === 0) return null
      const fw = FRAMEWORK_REGISTRY[slot.frameworkType]
      const nodeList = slot.graph.nodes
        .filter((n) => n.role !== 'unclassified')
        .map((n) => `  - ID: "${n.id}", ラベル: "${n.label}", role: ${n.role}`)
        .join('\n')
      return `スロット${index} (${fw.label}):\n${nodeList}`
    })
    .filter(Boolean)
    .join('\n\n')

  return `以下のフレームワーク分析結果を横断して、関連するノードのクロスリンクを提案してください:\n\n${slotDescriptions}`
}
