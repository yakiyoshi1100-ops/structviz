import { useAICrossLink } from '@/hooks/useAICrossLink'
import { useCrossLinkClassify } from '@/hooks/useCrossLinkClassify'
import { useConfigStore, useCrossLinkStore } from '@/stores'
import { FRAMEWORK_REGISTRY, FrameworkType } from '@/types'
import { getCompatibleFrameworks } from '@/types/crossLinkCompatibility'

// フレームワーク選択肢
const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string }[] = (
  Object.values(FrameworkType) as FrameworkType[]
).map((fw) => ({
  value: fw,
  label: `${FRAMEWORK_REGISTRY[fw].icon} ${FRAMEWORK_REGISTRY[fw].label}`,
}))

export function CrossLinkPanel() {
  const slots = useCrossLinkStore((s) => s.slots)
  const crossEdges = useCrossLinkStore((s) => s.crossEdges)
  const connectMode = useCrossLinkStore((s) => s.connectMode)
  const sharedInput = useCrossLinkStore((s) => s.sharedInput)
  const setSharedInput = useCrossLinkStore((s) => s.setSharedInput)
  const addSlot = useCrossLinkStore((s) => s.addSlot)
  const removeSlot = useCrossLinkStore((s) => s.removeSlot)
  const setSlotFramework = useCrossLinkStore((s) => s.setSlotFramework)
  const setConnectMode = useCrossLinkStore((s) => s.setConnectMode)
  const removeCrossEdge = useCrossLinkStore((s) => s.removeCrossEdge)
  const toggleCrossEdgeVisibility = useCrossLinkStore((s) => s.toggleCrossEdgeVisibility)
  const clearCrossEdges = useCrossLinkStore((s) => s.clearCrossEdges)
  const suggestResult = useCrossLinkStore((s) => s.suggestResult)
  const setSuggestResult = useCrossLinkStore((s) => s.setSuggestResult)

  const { classifySlot } = useCrossLinkClassify()
  const { suggestCrossLinks, isSuggesting } = useAICrossLink()
  const isAiMode = useConfigStore((s) => s.mode === 'ai' && Boolean(s.apiKey))

  // 指定スロット以外のフレームワーク選択から互換セットを算出
  const compatibleForSlot = (slotId: string): Set<FrameworkType> => {
    const others = slots
      .filter((s) => s.id !== slotId && s.frameworkType !== null)
      .map((s) => s.frameworkType as FrameworkType)
    return getCompatibleFrameworks(others)
  }

  // スロット追加ボタン: 全スロット選択済み時に3つ目の互換候補がなければ無効化
  const canAddSlot = (() => {
    if (slots.length >= 3) return false
    const allSelected = slots
      .filter((s) => s.frameworkType !== null)
      .map((s) => s.frameworkType as FrameworkType)
    if (allSelected.length < 2) return true
    return getCompatibleFrameworks(allSelected).size > 0
  })()

  const isAnyLoading = slots.some((s) => s.isLoading)
  const activeSlotCount = slots.filter((s) => s.graph && s.graph.nodes.length > 0).length
  const canExpand = sharedInput.trim() !== '' && slots.some((s) => s.frameworkType !== null)

  // 全スロットを共通テキストで一括展開
  const expandAll = () => {
    const text = sharedInput.trim()
    if (!text) return
    for (const slot of slots) {
      if (slot.frameworkType) {
        void classifySlot(slot.id, text, slot.frameworkType)
      }
    }
  }

  return (
    <div className="crosslink-panel">
      {/* ── 入力エリア ── */}
      <div className="crosslink-input-area">
        <textarea
          className="crosslink-shared-textarea"
          placeholder="分析するテキストを入力（Ctrl+Enter で全スロット展開）..."
          value={sharedInput}
          rows={3}
          onChange={(e) => setSharedInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              if (canExpand && !isAnyLoading) expandAll()
            }
          }}
        />
        <button
          type="button"
          className="crosslink-expand-btn"
          disabled={!canExpand || isAnyLoading}
          onClick={expandAll}
          title="フレームワークが選択されているスロットを一括展開"
        >
          {isAnyLoading ? '処理中...' : '▶ 全スロット展開'}
        </button>
      </div>

      {/* ── フレームワーク選択行 ── */}
      <div className="crosslink-slots">
        {slots.map((slot, index) => (
          <div key={slot.id} className="crosslink-slot">
            <div className="crosslink-slot__head">
              <span className="crosslink-slot__num">スロット {index + 1}</span>
              <div className="crosslink-slot__indicators">
                {slot.isLoading && <span className="crosslink-slot__spinner">⟳</span>}
                {!slot.isLoading && slot.graph && (
                  <span className="crosslink-slot__done" title={`${slot.graph.nodes.length}ノード`}>
                    ✓
                  </span>
                )}
              </div>
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
            {(() => {
              const compat = compatibleForSlot(slot.id)
              const constrained = slots.some(
                (s) => s.id !== slot.id && s.frameworkType !== null,
              )
              const isIncompat =
                slot.frameworkType !== null &&
                constrained &&
                !compat.has(slot.frameworkType)
              return (
                <>
                  {isIncompat && (
                    <div className="crosslink-slot__warning">
                      ⚠ この組み合わせは非互換です
                    </div>
                  )}
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
                    {FRAMEWORK_OPTIONS.map((opt) => {
                      const disabled =
                        constrained && !compat.has(opt.value as FrameworkType)
                      return (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={disabled}
                        >
                          {opt.label}
                        </option>
                      )
                    })}
                  </select>
                </>
              )
            })()}
          </div>
        ))}

        {/* スロット追加ボタン */}
        {canAddSlot && (
          <button type="button" className="crosslink-add-slot" onClick={addSlot}>
            ＋
          </button>
        )}
      </div>

      {/* ── ツールバー ── */}
      <div className="crosslink-toolbar">
        {/* AIクロスリンク提案ボタン */}
        {isAiMode && (
          <button
            type="button"
            className={`crosslink-ai-suggest${isSuggesting ? ' loading' : ''}`}
            disabled={isSuggesting || activeSlotCount < 2}
            onClick={() => void suggestCrossLinks()}
            title={
              activeSlotCount < 2
                ? '2スロット以上グラフを展開してください'
                : 'AIが関連ノードを自動でクロスリンク'
            }
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
          <p className="crosslink-connect-hint">ノード端（●）からドラッグして別スロットへ接続</p>
        )}

        {/* AI提案結果メッセージ */}
        {suggestResult && !isSuggesting && (
          <div
            className={`crosslink-suggest-result crosslink-suggest-result--${suggestResult.type}`}
          >
            <span>
              {suggestResult.type === 'success' && '✅ '}
              {suggestResult.type === 'empty' && '⚠️ '}
              {suggestResult.type === 'error' && '❌ '}
              {suggestResult.message}
            </span>
            <button
              type="button"
              className="crosslink-suggest-result__close"
              onClick={() => setSuggestResult(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* クロスエッジ一覧 */}
        {crossEdges.length > 0 && (
          <div className="crosslink-edge-list">
            <span className="crosslink-edge-list__label">
              リンク ({crossEdges.filter((e) => !e.hidden).length}/{crossEdges.length})
            </span>
            <button
              type="button"
              className="crosslink-clear-btn"
              onClick={clearCrossEdges}
              title="全リンクを完全削除"
            >
              全削除
            </button>
            {crossEdges.map((ce) => (
              <div
                key={ce.id}
                className={`crosslink-edge-chip${ce.hidden ? ' crosslink-edge-chip--hidden' : ''}`}
              >
                {/* クリックで表示/非表示トグル */}
                <button
                  type="button"
                  className="crosslink-edge-chip__label"
                  title={ce.hidden ? 'クリックで表示' : 'クリックで非表示'}
                  onClick={() => toggleCrossEdgeVisibility(ce.id)}
                >
                  <span className="crosslink-edge-chip__eye">{ce.hidden ? '🙈' : '👁'}</span>
                  {ce.reason ?? '接続'}
                </button>
                {/* 完全削除ボタン */}
                <button
                  type="button"
                  className="crosslink-edge-chip__del"
                  title="このリンクを削除"
                  onClick={() => removeCrossEdge(ce.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
