import { useCrossLinkClassify } from '@/hooks/useCrossLinkClassify'
import { useCrossLinkStore } from '@/stores/crossLinkStore'
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
  const { classifySlot } = useCrossLinkClassify()

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
        <label className="crosslink-connect-toggle">
          <input
            type="checkbox"
            checked={connectMode}
            onChange={(e) => setConnectMode(e.target.checked)}
          />
          <span className={`crosslink-connect-badge${connectMode ? ' active' : ''}`}>
            {connectMode ? '🔗 接続モード ON' : '🔗 接続モード OFF'}
          </span>
        </label>

        {connectMode && (
          <p className="crosslink-connect-hint">
            別スロットのノード同士をドラッグして接続 / エッジをクリックで削除
          </p>
        )}

        {crossEdges.length > 0 && (
          <div className="crosslink-edge-list">
            <span className="crosslink-edge-list__label">クロスリンク ({crossEdges.length})</span>
            {crossEdges.map((ce) => (
              <button
                key={ce.id}
                type="button"
                className="crosslink-edge-chip"
                title="クリックで削除"
                onClick={() => removeCrossEdge(ce.id)}
              >
                ✕
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
