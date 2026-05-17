import { useAICrossLink } from '@/hooks/useAICrossLink'
import { useCrossLinkClassify } from '@/hooks/useCrossLinkClassify'
import { useConfigStore, useCrossLinkStore } from '@/stores'
import { FRAMEWORK_REGISTRY, FrameworkType } from '@/types'

// フレームワーク選択肢をカテゴリ順に並べる
const FRAMEWORK_OPTIONS = Object.values(FrameworkType).map((fw) => ({
  value: fw,
  label: `${FRAMEWORK_REGISTRY[fw].icon} ${FRAMEWORK_REGISTRY[fw].label}`,
  category: FRAMEWORK_REGISTRY[fw].category,
}))

export function CrossLinkPanel() {
  const slots = useCrossLinkStore((s) => s.slots)
  const crossEdges = useCrossLinkStore((s) => s.crossEdges)
  const connectMode = useCrossLinkStore((s) => s.connectMode)
  const addSlot = useCrossLinkStore((s) => s.addSlot)
  const removeSlot = useCrossLinkStore((s) => s.removeSlot)
  const setSlotFramework = useCrossLinkStore((s) => s.setSlotFramework)
  const setSlotInput = useCrossLinkStore((s) => s.setSlotInput)
  const setConnectMode = useCrossLinkStore((s) => s.setConnectMode)
  const removeCrossEdge = useCrossLinkStore((s) => s.removeCrossEdge)
  const clearCrossEdges = useCrossLinkStore((s) => s.clearCrossEdges)
  const { classifySlot } = useCrossLinkClassify()
  const { suggestCrossLinks, isSuggesting } = useAICrossLink()
  const isAiMode = useConfigStore((s) => s.mode === 'ai' && Boolean(s.apiKey))
  const activeSlotCount = slots.filter((s) => s.graph && s.graph.nodes.length > 0).length

  return (
    <div className="crosslink-panel">
      {/* スロット一覧 */}
      <div className="crosslink-slots">
        {slots.map((slot, index) => (
          <div key={slot.id} className="crosslink-slot">
            {/* スロットヘッダー */}
            <div className="crosslink-slot__head">
              <span className="crosslink-slot__num">スロット {index + 1}</span>
              {slots.length > 2 && (
                <button
                  type="button"
                  className="crosslink-slot__remove"
                  title="スロットを削除"
                  onClick={() => removeSlot(slot.id)}
                >
                  ×
                </button>
              )}
            </div>

            {/* フレームワーク選択 */}
            <select
              className="crosslink-slot__select"
              value={slot.frameworkType ?? ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSlotFramework(slot.id, e.target.value as FrameworkType)
                }
              }}
            >
              <option value="">フレームワークを選択</option>
              {FRAMEWORK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* テキスト入力 */}
            <textarea
              className="crosslink-slot__textarea"
              placeholder="分析するテキストを入力..."
              value={slot.inputText}
              rows={3}
              onChange={(e) => setSlotInput(slot.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  if (slot.frameworkType && slot.inputText.trim()) {
                    void classifySlot(slot.id, slot.inputText, slot.frameworkType)
                  }
                }
              }}
            />

            {/* 展開ボタン */}
            <button
              type="button"
              className="crosslink-slot__btn"
              disabled={!slot.frameworkType || !slot.inputText.trim() || slot.isLoading}
              onClick={() => {
                if (slot.frameworkType && slot.inputText.trim()) {
                  void classifySlot(slot.id, slot.inputText, slot.frameworkType)
                }
              }}
            >
              {slot.isLoading ? '処理中...' : '▶ 展開する'}
            </button>
          </div>
        ))}

        {/* スロット追加ボタン */}
        {slots.length < 3 && (
          <button type="button" className="crosslink-add-slot" onClick={addSlot}>
            ＋ スロット追加
          </button>
        )}
      </div>

      {/* ツールバー */}
      <div className="crosslink-toolbar">
        {/* AIクロスリンク提案ボタン（メイン機能） */}
        {isAiMode && (
          <button
            type="button"
            className={`crosslink-ai-suggest${isSuggesting ? ' loading' : ''}`}
            disabled={isSuggesting || activeSlotCount < 2}
            onClick={() => void suggestCrossLinks()}
            title={activeSlotCount < 2 ? '2スロット以上グラフを展開してください' : 'AIが関連ノードを自動でクロスリンク'}
          >
            {isSuggesting ? '🤖 AI分析中...' : '🤖 AIクロスリンク提案'}
          </button>
        )}

        {/* 手動接続モード */}
        <label className="crosslink-connect-toggle">
          <input
            type="checkbox"
            checked={connectMode}
            onChange={(e) => setConnectMode(e.target.checked)}
          />
          <span className={`crosslink-connect-badge${connectMode ? ' active' : ''}`}>
            {connectMode ? '✋ 手動接続 ON' : '✋ 手動接続'}
          </span>
        </label>

        {connectMode && (
          <p className="crosslink-connect-hint">
            別スロットのノード端（●）からドラッグして接続
          </p>
        )}

        {/* クロスエッジ一覧 */}
        {crossEdges.length > 0 && (
          <div className="crosslink-edge-list">
            <span className="crosslink-edge-list__label">リンク ({crossEdges.length})</span>
            <button
              type="button"
              className="crosslink-clear-btn"
              onClick={clearCrossEdges}
              title="全リンクを削除"
            >
              全削除
            </button>
            {crossEdges.map((ce) => (
              <button
                key={ce.id}
                type="button"
                className="crosslink-edge-chip"
                title={ce.reason ?? 'クリックで削除'}
                onClick={() => removeCrossEdge(ce.id)}
              >
                {ce.reason ? `${ce.reason} ✕` : '✕'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
