import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ZoomPanCanvas, type ZoomPanHandle, type ZoomPanTransform } from './ZoomPanCanvas'
import { type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import {
  buildVsmSegments,
  buildVsmStream,
  type VsmSegment,
  vsmGridTemplateColumns,
} from './layouts/vsmLayout'

// ══════════════════════════════════════════════════════════════════════════════
// VSM — 左から右への価値の流れ（マップとリードタイム帯は同一グリッド列）
// ══════════════════════════════════════════════════════════════════════════════

const STREAM_DROP_ROLE: NodeRole = 'vsm_value_add'

interface VSMCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

function FlowArrow() {
  return (
    <svg width={28} height={16} viewBox="0 0 28 16" fill="none" aria-hidden>
      <path
        d="M0 8 H22 M16 3 L22 8 L16 13"
        stroke="#64748b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditableChip({
  node,
  style,
  onEdit,
  onDragStart,
}: {
  node: StructuredNode
  style: React.CSSProperties
  onEdit: (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.label)

  const commit = () => {
    setEditing(false)
    const t = value.trim()
    if (t && t !== node.label) onEdit(node.id, t)
    else setValue(node.label)
  }

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        if (!editing) onDragStart(e, node.id)
      }}
      onDoubleClick={() => {
        setEditing(true)
        setValue(node.label)
      }}
      title="ダブルクリックで編集 / ドラッグで移動"
      style={{ ...style, cursor: 'grab', userSelect: 'none', wordBreak: 'break-word' }}
    >
      {editing ? (
        <input
          autoFocus
          value={value}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: 'inherit',
            font: 'inherit',
            textAlign: 'center',
            padding: 0,
          }}
          onBlur={commit}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

function ProcessBox({
  node,
  onEdit,
  onDragStart,
}: {
  node: StructuredNode
  onEdit: (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  const color = '#16a34a'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 148,
          minHeight: 72,
          background: '#f0fdf4',
          border: `2.5px solid ${color}`,
          borderRadius: 4,
          padding: '20px 10px 12px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            right: 12,
            height: 10,
            background: `repeating-linear-gradient(90deg, ${color} 0 8px, #f0fdf4 8px 16px)`,
            borderRadius: '2px 2px 0 0',
          }}
        />
        <EditableChip
          node={node}
          onEdit={onEdit}
          onDragStart={onDragStart}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#14532d',
            textAlign: 'center',
            lineHeight: 1.45,
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, marginTop: 6 }}>付加価値</span>
    </div>
  )
}

function InventoryTriangle({
  node,
  bottleneck,
  onEdit,
  onDragStart,
}: {
  node: StructuredNode
  bottleneck: boolean
  onEdit: (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  const color = bottleneck ? '#dc2626' : '#f59e0b'
  const bg = bottleneck ? '#fef2f2' : '#fffbeb'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: 88, height: 74 }}>
        <svg width={88} height={74} viewBox="0 0 88 74" aria-hidden>
          <polygon
            points="44,6 82,68 6,68"
            fill={bg}
            stroke={color}
            strokeWidth={bottleneck ? 3 : 2}
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ position: 'absolute', top: 30, left: 8, right: 8, textAlign: 'center' }}>
          <EditableChip
            node={node}
            onEdit={onEdit}
            onDragStart={onDragStart}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: bottleneck ? '#7f1d1d' : '#78350f',
              lineHeight: 1.35,
            }}
          />
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, marginTop: 6 }}>
        {bottleneck ? 'ボトルネック' : '待ち・在庫'}
      </span>
    </div>
  )
}

function EndpointPanel({
  title,
  sub,
  icon,
  nodes,
  accent,
  onEdit,
  onDrop,
  onDragStart,
}: {
  title: string
  sub: string
  icon: string
  nodes: StructuredNode[]
  accent: string
  onEdit: (id: string, label: string) => void
  onDrop: (nodeId: string, role: NodeRole) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: 140,
        background: '#fff',
        border: `2px solid ${accent}`,
        borderRadius: 12,
        padding: '12px 10px 10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id, title === '入力' ? 'vsm_input' : 'vsm_output')
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: accent, marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {nodes.length === 0 ? (
          <span style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>—</span>
        ) : (
          nodes.map((node) => (
            <EditableChip
              key={node.id}
              node={node}
              onEdit={onEdit}
              onDragStart={onDragStart}
              style={{
                background: accent + '18',
                border: `1px solid ${accent}55`,
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: '#0f172a',
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MapCell({
  segment,
  input,
  output,
  onEdit,
  onDrop,
  onDragStart,
  onStreamDrop,
}: {
  segment: VsmSegment
  input: StructuredNode[]
  output: StructuredNode[]
  onEdit: (id: string, label: string) => void
  onDrop: (nodeId: string, role: NodeRole) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
  onStreamDrop: (nodeId: string) => void
}) {
  const cellStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '16px 4px 12px',
    minHeight: 150,
    boxSizing: 'border-box',
  }

  switch (segment.kind) {
    case 'input':
      return (
        <div style={cellStyle}>
          <EndpointPanel
            title="入力"
            sub="受注・原材料"
            icon="📥"
            nodes={input}
            accent="#6366f1"
            onEdit={onEdit}
            onDrop={onDrop}
            onDragStart={onDragStart}
          />
        </div>
      )
    case 'output':
      return (
        <div style={cellStyle}>
          <EndpointPanel
            title="出力"
            sub="納品・完成"
            icon="📤"
            nodes={output}
            accent="#2563eb"
            onEdit={onEdit}
            onDrop={onDrop}
            onDragStart={onDragStart}
          />
        </div>
      )
    case 'arrow':
      return (
        <div style={{ ...cellStyle, alignItems: 'center', padding: '0 4px' }}>
          <FlowArrow />
        </div>
      )
    case 'empty':
      return (
        <div
          style={{
            ...cellStyle,
            alignItems: 'center',
            background: 'linear-gradient(180deg, #f1f5f9 0%, #fff 100%)',
            borderRadius: 8,
            margin: '12px 4px',
            border: '1px dashed #cbd5e1',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData('text/plain')
            if (id) onStreamDrop(id)
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '0 16px' }}>
            工程・待ち・ボトルネックをここに表示
          </span>
        </div>
      )
    case 'process':
    case 'wait':
      if (!segment.node) return null
      return (
        <div
          style={cellStyle}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const id = e.dataTransfer.getData('text/plain')
            if (id) onStreamDrop(id)
          }}
        >
          {segment.kind === 'process' ? (
            <ProcessBox node={segment.node} onEdit={onEdit} onDragStart={onDragStart} />
          ) : (
            <InventoryTriangle
              node={segment.node}
              bottleneck={segment.node.role === 'vsm_bottleneck'}
              onEdit={onEdit}
              onDragStart={onDragStart}
            />
          )}
        </div>
      )
    default:
      return null
  }
}

export function VSMCanvas({ graph, onNodeEdit, onNodeMove }: VSMCanvasProps) {
  const streamData = useMemo(() => buildVsmStream(graph), [graph])
  const segments = useMemo(() => buildVsmSegments(streamData), [streamData])
  const gridCols = vsmGridTemplateColumns(segments)

  const mapViewportRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const bottomScrollRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ZoomPanHandle>(null)
  const syncingScroll = useRef(false)

  const metricsRef = useRef({ contentW: 0, viewportW: 0, scale: 1, tx: 0 })
  const [, bumpMetrics] = useState(0)

  const measureLayout = useCallback(() => {
    const grid = gridRef.current
    const vp = mapViewportRef.current
    if (!grid || !vp) return
    metricsRef.current.contentW = grid.offsetWidth
    metricsRef.current.viewportW = vp.clientWidth
    bumpMetrics((n) => n + 1)
  }, [])

  useLayoutEffect(() => {
    measureLayout()
    const grid = gridRef.current
    const vp = mapViewportRef.current
    if (!grid || !vp) return
    const ro = new ResizeObserver(() => measureLayout())
    ro.observe(grid)
    ro.observe(vp)
    return () => ro.disconnect()
  }, [segments, measureLayout])

  const maxHScroll = () => {
    const { contentW, viewportW, scale } = metricsRef.current
    return Math.max(0, contentW * scale - viewportW)
  }

  const syncBarFromMap = (tx: number) => {
    const bar = bottomScrollRef.current
    if (!bar || syncingScroll.current) return
    syncingScroll.current = true
    bar.scrollLeft = Math.min(maxHScroll(), Math.max(0, -tx))
    syncingScroll.current = false
  }

  const onMapTransform = useCallback(
    (t: ZoomPanTransform) => {
      metricsRef.current.scale = t.scale
      metricsRef.current.tx = t.tx
      bumpMetrics((n) => n + 1)
      syncBarFromMap(t.tx)
    },
    [],
  )

  const onBarScroll = () => {
    if (syncingScroll.current) return
    const bar = bottomScrollRef.current
    if (!bar) return
    syncingScroll.current = true
    zoomRef.current?.setTx(-bar.scrollLeft)
    syncingScroll.current = false
  }

  const onMapWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.shiftKey) return
    e.preventDefault()
    e.stopPropagation()
    const t = zoomRef.current?.getTransform()
    if (!t) return
    const nextTx = t.tx - e.deltaY
    const clamped = Math.max(-maxHScroll(), Math.min(0, nextTx))
    zoomRef.current?.setTx(clamped)
  }

  const scrollTrackWidth =
    Math.max(metricsRef.current.viewportW, metricsRef.current.contentW * metricsRef.current.scale)

  const assignRole = (nodeId: string, role: NodeRole) => {
    onNodeEdit(nodeId, { role })
    onNodeMove(nodeId, { x: 0, y: 0 })
  }

  const handleLabelEdit = (nodeId: string, label: string) => {
    onNodeEdit(nodeId, { label })
  }

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: '#f8fafc',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ flexShrink: 0, padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.12em' }}>
          VALUE STREAM MAP
        </div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
          マップ直下の横スクロールバーで左右移動（ズーム倍率に連動）。ホイールで拡大縮小、Shift+ホイールで横移動。
        </div>
      </div>

      {/* マップ領域（高さ100%）+ 直下の横スクロールバー */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '0 20px 16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={mapViewportRef}
          onWheel={onMapWheel}
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            background: '#fff',
            borderRadius: '12px 12px 0 0',
            border: '1px solid #e2e8f0',
            borderBottom: 'none',
          }}
        >
          <ZoomPanCanvas ref={zoomRef} onTransformChange={onMapTransform}>
            <div ref={gridRef} style={{ width: 'max-content', padding: '20px 20px 28px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  width: 'max-content',
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                  paddingBottom: 4,
                }}
              >
                {segments.map((segment, index) => (
                  <MapCell
                    key={`map-${index}-${segment.kind}-${segment.node?.id ?? ''}`}
                    segment={segment}
                    input={streamData.input}
                    output={streamData.output}
                    onEdit={handleLabelEdit}
                    onDrop={assignRole}
                    onDragStart={handleDragStart}
                    onStreamDrop={(id) => assignRole(id, STREAM_DROP_ROLE)}
                  />
                ))}

                {segments.map((segment, index) => (
                  <div
                    key={`tl-${index}-${segment.kind}-${segment.node?.id ?? ''}`}
                    style={{ padding: '0 4px 14px', boxSizing: 'border-box' }}
                  >
                    {segment.timelineColor ? (
                      <div
                        title={segment.node?.label ?? segment.kind}
                        style={{
                          height: 14,
                          background: segment.timelineColor,
                          borderRadius:
                            segment.kind === 'input' || segment.kind === 'output' ? 4 : 2,
                          border:
                            segment.kind === 'input' || segment.kind === 'output'
                              ? '1px solid rgba(0,0,0,0.06)'
                              : 'none',
                        }}
                      />
                    ) : (
                      <div style={{ height: 14 }} aria-hidden />
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 12,
                  flexWrap: 'wrap',
                  paddingLeft: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.08em',
                    width: '100%',
                  }}
                >
                  リードタイム（概念）— 上のマップと列位置を揃えています
                </span>
                {[
                  { color: '#86efac', label: '付加価値時間' },
                  { color: '#fde68a', label: '待ち・非付加価値' },
                  { color: '#fca5a5', label: 'ボトルネック' },
                  { color: '#c7d2fe', label: '入力' },
                  { color: '#93c5fd', label: '出力' },
                ].map((item) => (
                  <span
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: '#64748b',
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: item.color,
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </ZoomPanCanvas>
        </div>

        <div
          ref={bottomScrollRef}
          className="vsm-h-scroll"
          role="scrollbar"
          aria-label="横スクロール"
          aria-orientation="horizontal"
          onScroll={onBarScroll}
          style={{
            borderRadius: '0 0 12px 12px',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
          }}
        >
          <div style={{ width: scrollTrackWidth, height: 1 }} />
        </div>
      </div>
    </div>
  )
}
