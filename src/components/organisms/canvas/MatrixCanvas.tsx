import { useState } from 'react'

import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { getMatrixConfig } from './layouts/matrixLayout'

interface MatrixCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

// ── 定数: .sv-matrix の gap と一致させること ────────────────────────────────
const CELL_GAP    = 14   // px — .sv-matrix { gap: 14px } と合わせる
const ROW_TITLE_W = 24   // px — 縦軸タイトル列幅
const ROW_LABEL_W = 60   // px — 縦軸セグメントラベル列幅
const COL_TITLE_H = 24   // px — 横軸タイトル行高さ
const COL_LABEL_H = 44   // px — 横軸セグメントラベル行高さ

const TINT_COUNT = 8
const quadrantFrameworks = new Set<FrameworkType>([
  FrameworkType.SWOT,
  FrameworkType.ANSOFF,
  FrameworkType.CROSS_SWOT,
  FrameworkType.PRIORITY_MATRIX,
  FrameworkType.PPM,
])
const flowFrameworks = new Set<FrameworkType>([
  FrameworkType.BUSINESS_FLOW,
  FrameworkType.VSM,
  FrameworkType.DMAIC,
  FrameworkType.CUSTOMER_JOURNEY,
])

function splitCellLabel(label: string): { title: string; sub?: string } {
  const [title, ...rest] = label.split('\n')
  return { title, sub: rest.length > 0 ? rest.join(' / ') : undefined }
}

function frameworkClass(type: FrameworkType): string {
  return type.replace(/_/g, '-')
}

// ── 横軸セグメントラベル: ライン ── テキスト ── ライン ───────────────────────
function ColLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <div style={{ flex: 1, height: 2, background: '#94a3b8', borderRadius: 1 }} />
      <span style={{
        padding:      '3px 12px',
        fontSize:     14,
        fontWeight:   700,
        color:        '#1e293b',
        background:   '#ffffff',
        border:       '2px solid #94a3b8',
        borderRadius: 20,
        lineHeight:   1.2,
        whiteSpace:   'nowrap' as const,
        flexShrink:   0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: '#94a3b8', borderRadius: 1 }} />
    </div>
  )
}

// ── 縦軸セグメントラベル: ライン ── テキスト ── ライン ───────────────────────
function RowLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      <div style={{ flex: 1, width: 2, background: '#94a3b8', borderRadius: 1 }} />
      <span style={{
        padding:      '12px 3px',
        fontSize:     14,
        fontWeight:   700,
        color:        '#1e293b',
        background:   '#ffffff',
        border:       '2px solid #94a3b8',
        borderRadius: 20,
        writingMode:  'vertical-rl' as const,
        lineHeight:   1.2,
        whiteSpace:   'nowrap' as const,
        flexShrink:   0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, width: 2, background: '#94a3b8', borderRadius: 1 }} />
    </div>
  )
}

// ── 軸タイトル ───────────────────────────────────────────────────────────────
const AXIS_TITLE_STYLE: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            6,
  fontSize:       11,
  fontWeight:     800,
  color:          '#64748b',
  letterSpacing:  '0.1em',
  textTransform:  'uppercase' as const,
}

// ────────────────────────────────────────────────────────────────────────────
export function MatrixCanvas({ graph, onNodeEdit, onNodeMove }: MatrixCanvasProps) {
  const config  = getMatrixConfig(graph.frameworkType)
  const { colAxis, rowAxis } = config

  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const variant = quadrantFrameworks.has(graph.frameworkType)
    ? 'quadrant'
    : flowFrameworks.has(graph.frameworkType)
      ? 'flow'
      : 'cards'

  const startEdit = (node: StructuredNode) => {
    setEditingId(node.id)
    setEditingValue(node.label)
  }

  const commitEdit = () => {
    if (editingId && editingValue.trim()) onNodeEdit(editingId, { label: editingValue.trim() })
    setEditingId(null)
  }

  const moveToRole = (nodeId: string, role: NodeRole) => {
    onNodeEdit(nodeId, { role })
    onNodeMove(nodeId, { x: 0, y: 0 })
  }

  // ── セルの JSX（軸ラベルの有無で gridColumn/Row の付与が異なるため共通化） ──
  const cellGrid = (
    <div
      className={`matrix-canvas sv-matrix framework-visual framework-visual--${variant} framework-visual--${frameworkClass(graph.frameworkType)}`}
      style={{
        width:               '100%',
        height:              '100%',
        gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${config.rows}, minmax(0, 1fr))`,
      }}
    >
      {config.cells.flat().map((cell, index) => {
        const nodes = graph.nodes.filter((node) => node.role === cell.role)
        const label = splitCellLabel(cell.label)
        return (
          <section
            key={cell.role}
            className={`matrix-cell sv-cell framework-cell framework-cell--${variant}`}
            data-tint={(index % TINT_COUNT) + 1}
            style={{ '--cell-color': cell.color } as React.CSSProperties}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const nodeId = e.dataTransfer.getData('text/plain')
              if (nodeId) moveToRole(nodeId, cell.role)
            }}
          >
            <header className="sv-cell__head">
              <h2 className="matrix-cell-label sv-cell__title">{label.title}</h2>
              {label.sub && <span className="sv-cell__sub">{label.sub}</span>}
            </header>
            <div className="matrix-node-list sv-cell__body">
              {nodes.map((node) => (
                <article
                  key={node.id}
                  className="matrix-node sv-cell-card"
                  draggable
                  onClick={() => startEdit(node)}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', node.id)}
                >
                  {editingId === node.id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onBlur={commitEdit}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
                    />
                  ) : (
                    node.label
                  )}
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )

  // 軸ラベルなし → そのままセルグリッドを返す
  if (!colAxis && !rowAxis) return cellGrid

  // ── 軸ラベルあり: 外枠グリッドで colAxis/rowAxis/matrix を分離配置 ─────────
  // 外枠の gap=0 にすることで、colAxis と matrix の列区切りが同一 x 座標で
  // 連続し（同じ 1fr × columnGap: CELL_GAP を使うため）、ズレが発生しない。
  const rowAxisW = (rowAxis?.title ? ROW_TITLE_W : 0) + (rowAxis ? ROW_LABEL_W : 0)
  const colAxisH = (colAxis?.title ? COL_TITLE_H : 0) + (colAxis ? COL_LABEL_H : 0)

  const outerCols = rowAxis ? `${rowAxisW}px 1fr` : '1fr'
  const outerRows = colAxis ? `${colAxisH}px 1fr` : '1fr'

  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: outerCols, gridTemplateRows: outerRows, gap: 0, background: 'var(--color-bg)' }}>

      {/* ── 左上コーナー（空白） ─────────────────────────────────────────── */}
      {rowAxis && colAxis && <div />}

      {/* ── 横軸ラベルエリア（上部）─────────────────────────────────────── */}
      {colAxis && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          columnGap:           CELL_GAP,
          gridTemplateRows:    colAxis.title
            ? `${COL_TITLE_H}px ${COL_LABEL_H}px`
            : `${COL_LABEL_H}px`,
          alignItems:          'center',
        }}>
          {colAxis.title && (
            <div style={{ ...AXIS_TITLE_STYLE, gridColumn: '1 / -1', gridRow: 1 }}>
              <span style={{ opacity: 0.5 }}>←</span>
              {colAxis.title}
              <span style={{ opacity: 0.5 }}>→</span>
            </div>
          )}
          {colAxis.labels.map((label, i) => (
            <div key={i} style={{
              gridColumn: i + 1,
              gridRow:    colAxis.title ? 2 : 1,
              display:    'flex',
              alignItems: 'center',
            }}>
              <ColLabel label={label} />
            </div>
          ))}
        </div>
      )}

      {/* ── 縦軸ラベルエリア（左部）─────────────────────────────────────── */}
      {rowAxis && (
        <div style={{
          display:             'grid',
          gridTemplateRows:    `repeat(${config.rows}, minmax(0, 1fr))`,
          rowGap:              CELL_GAP,
          gridTemplateColumns: rowAxis.title
            ? `${ROW_TITLE_W}px ${ROW_LABEL_W}px`
            : `${ROW_LABEL_W}px`,
        }}>
          {rowAxis.title && (
            <div style={{ ...AXIS_TITLE_STYLE, gridRow: '1 / -1', gridColumn: 1 }}>
              <span style={{ writingMode: 'vertical-rl' as const }}>
                {rowAxis.title}
              </span>
            </div>
          )}
          {rowAxis.labels.map((label, i) => (
            <div key={i} style={{
              gridRow:    i + 1,
              gridColumn: rowAxis.title ? 2 : 1,
              display:    'flex',
              alignItems: 'stretch',
            }}>
              <RowLabel label={label} />
            </div>
          ))}
        </div>
      )}

      {/* ── マトリクスセルグリッド（右下） ─────────────────────────────── */}
      {cellGrid}
    </div>
  )
}
