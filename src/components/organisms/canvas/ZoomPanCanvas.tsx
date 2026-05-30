import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

// ══════════════════════════════════════════════════════════════════════════════
// ZoomPanCanvas — 汎用ズーム・パン・FitViewラッパー
//
// 設計:
//   wrapper (overflow:hidden, position:relative)
//     scrollArea (overflow:auto)  ← scrollLeft/scrollTop でパン
//       spacer   (width: naturalW*scale, height: naturalH*scale)  ← スクロール領域確保
//       content  (position:absolute, top:0 left:0, transform:scale)
//     controls   (position:absolute, outside scrollArea)
//
// CSS transform は layout に影響しないため、zoom 時のスクロールバーを
// 正しく追従させるには spacer でレイアウト幅を明示的に拡張する必要がある。
// tx/ty は廃止し scrollLeft/scrollTop をパンの source-of-truth とする。
// ══════════════════════════════════════════════════════════════════════════════

const MIN_SCALE = 0.08
const MAX_SCALE = 5
const ZOOM_STEP = 1.12

const PASSIVE_SELECTORS = [
  '[draggable="true"]',
  'button',
  'input',
  'textarea',
  'a',
  'select',
  'label',
].join(', ')

export interface ZoomPanTransform {
  scale: number
  tx: number
  ty: number
}

export interface ZoomPanHandle {
  getTransform: () => ZoomPanTransform
  setTx: (tx: number) => void
  setTy: (ty: number) => void
  fitView: () => void
}

interface ZoomPanCanvasProps {
  children: React.ReactNode
  onTransformChange?: (transform: ZoomPanTransform) => void
}

export const ZoomPanCanvas = forwardRef<ZoomPanHandle, ZoomPanCanvasProps>(function ZoomPanCanvas(
  { children, onTransformChange },
  ref,
) {
  // wrapperRef: 外枠（overflow:hidden）。controls の基準点。scrollbar 非表示。
  const wrapperRef = useRef<HTMLDivElement>(null)
  // scrollRef: スクロール領域（overflow:auto）。パンを scrollLeft/scrollTop で管理。
  const scrollRef  = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1) // イベントハンドラで最新スケールを同期的に参照するための ref

  // コンテンツの自然サイズ（scale=1 時の幅・高さ）
  // wrapper.clientWidth を使うことで scrollbar による歪みを排除
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)

  const dragging = useRef(false)
  const lastXY   = useRef({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)

  // scaleRef を scale state と同期（イベントハンドラ内での stale closure 防止）
  useLayoutEffect(() => { scaleRef.current = scale }, [scale])

  // wrapper サイズを自然サイズとして計測（ResizeObserver）
  // wrapper は overflow:hidden なので scrollbar の影響を受けない
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      setNaturalW(el.clientWidth)
      setNaturalH(el.clientHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // onTransformChange: scroll イベントと scale 変化で通知
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !onTransformChange) return
    const onScroll = () =>
      onTransformChange({ scale: scaleRef.current, tx: -el.scrollLeft, ty: -el.scrollTop })
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onTransformChange])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !onTransformChange) return
    onTransformChange({ scale, tx: -el.scrollLeft, ty: -el.scrollTop })
  }, [scale, onTransformChange])

  // ZoomPanHandle: tx/ty API を scrollLeft/scrollTop に変換して公開
  useImperativeHandle(ref, () => ({
    getTransform: () => ({
      scale,
      tx: -(scrollRef.current?.scrollLeft ?? 0),
      ty: -(scrollRef.current?.scrollTop  ?? 0),
    }),
    setTx: (tx) => { if (scrollRef.current) scrollRef.current.scrollLeft = -tx },
    setTy: (ty) => { if (scrollRef.current) scrollRef.current.scrollTop  = -ty },
    fitView,
  }))

  // グローバル mousemove / mouseup — ドラッグパン
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastXY.current.x
      const dy = e.clientY - lastXY.current.y
      lastXY.current = { x: e.clientX, y: e.clientY }
      const el = scrollRef.current
      if (el && (dx !== 0 || dy !== 0)) {
        el.scrollLeft -= dx
        el.scrollTop  -= dy
      }
    }
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false
        setPanning(false)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest(PASSIVE_SELECTORS)) return
    dragging.current = true
    lastXY.current = { x: e.clientX, y: e.clientY }
    setPanning(true)
    e.preventDefault()
  }

  // ホイールズーム — カーソル位置を固定点としてズーム
  // 数式: newScrollLeft = scrollLeft * ratio + cx * (ratio - 1)
  // (カーソル下のコンテンツ座標を不変に保つ条件から導出)
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const el   = scrollRef.current!
    const rect = el.getBoundingClientRect()
    const cx   = e.clientX - rect.left
    const cy   = e.clientY - rect.top
    const fac  = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
    const s    = scaleRef.current
    const ns   = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * fac))
    const ratio = ns / s
    el.scrollLeft = el.scrollLeft * ratio + cx * (ratio - 1)
    el.scrollTop  = el.scrollTop  * ratio + cy * (ratio - 1)
    setScale(ns)
  }

  const fitView = () => {
    setScale(1)
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
      scrollRef.current.scrollTop  = 0
    }
  }

  const zoom = (factor: number) => {
    const el = scrollRef.current
    if (!el) return
    const s    = scaleRef.current
    const ns   = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor))
    const ratio = ns / s
    const cx   = el.clientWidth  / 2
    const cy   = el.clientHeight / 2
    el.scrollLeft = el.scrollLeft * ratio + cx * (ratio - 1)
    el.scrollTop  = el.scrollTop  * ratio + cy * (ratio - 1)
    setScale(ns)
  }

  // スペーサーサイズ = 自然サイズ × scale → スクロール領域を zoom に追従させる
  const spacerW = naturalW > 0 ? naturalW * scale : undefined
  const spacerH = naturalH > 0 ? naturalH * scale : undefined

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── スクロール領域 ── */}
      <div
        ref={scrollRef}
        style={{
          position:   'absolute',
          inset:      0,
          overflow:   'auto',
          cursor:     panning ? 'grabbing' : 'default',
          userSelect: panning ? 'none' : 'auto',
        }}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        {/* スペーサー: zoom 倍率に応じたスクロール領域を確保 */}
        <div
          aria-hidden
          style={{
            width:         spacerW ?? '100%',
            height:        spacerH ?? '100%',
            minWidth:      '100%',
            minHeight:     '100%',
            pointerEvents: 'none',
          }}
        />

        {/* コンテンツ: 常に (0,0) 起点、scale のみ適用 (translate なし) */}
        <div
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            width:           naturalW > 0 ? naturalW : '100%',
            height:          naturalH > 0 ? naturalH : '100%',
            transformOrigin: '0 0',
            transform:       `scale(${scale})`,
            pointerEvents:   panning ? 'none' : 'auto',
          }}
        >
          {children}
        </div>
      </div>

      {/* ── コントロール (スクロール領域の外 → スクロールしない) ── */}
      <div
        style={{
          position:      'absolute',
          bottom:        14,
          left:          14,
          display:       'flex',
          flexDirection: 'column',
          gap:           4,
          zIndex:        300,
        }}
      >
        <CtrlBtn onClick={() => zoom(ZOOM_STEP)} title="ズームイン">＋</CtrlBtn>
        <CtrlBtn onClick={() => zoom(1 / ZOOM_STEP)} title="ズームアウト">－</CtrlBtn>
        <CtrlBtn onClick={fitView} title="全体表示" wide>
          ⊡<span style={{ fontSize: 10, marginLeft: 3 }}>Fit</span>
        </CtrlBtn>
      </div>

      {Math.abs(scale - 1) > 0.005 && (
        <div
          style={{
            position:      'absolute',
            bottom:        14,
            right:         14,
            background:    'rgba(255,255,255,0.90)',
            border:        '1px solid #e2e8f0',
            borderRadius:  6,
            padding:       '3px 9px',
            fontSize:      11,
            color:         '#64748b',
            fontWeight:    600,
            zIndex:        300,
            pointerEvents: 'none',
          }}
        >
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
})

function CtrlBtn({
  onClick,
  title,
  children,
  wide,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height:         32,
        width:          wide ? 68 : 32,
        background:     hover ? '#f1f5f9' : 'rgba(255,255,255,0.95)',
        border:         `1px solid ${hover ? '#94a3b8' : '#e2e8f0'}`,
        borderRadius:   7,
        cursor:         'pointer',
        fontSize:       16,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      '0 1px 5px rgba(0,0,0,0.10)',
        color:          '#374151',
        fontWeight:     700,
        transition:     'background 0.12s, border-color 0.12s',
        padding:        '0 6px',
        gap:            2,
      }}
    >
      {children}
    </button>
  )
}
