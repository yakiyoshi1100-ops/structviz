import { useMemo, useState } from 'react'
import { type FrameworkGraph, type StructuredNode } from '@/types'
import {
  buildRaciRows,
  type RaciAssignmentRole,
  type RaciRow,
} from './layouts/raciLayout'

// ══════════════════════════════════════════════════════════════════════════════
// RACI チャート — 活動（行）× R/A/C/I（列）の表形式キャンバス
// ══════════════════════════════════════════════════════════════════════════════

const COLUMNS: Array<{
  role: RaciAssignmentRole
  letter: string
  title: string
  sub: string
  header: string
  cellBg: string
  chip: string
  chipFg: string
  border: string
}> = [
  {
    role: 'raci_responsible',
    letter: 'R',
    title: '実行責任',
    sub: 'Responsible',
    header: '#dc2626',
    cellBg: '#fff5f5',
    chip: '#fecaca',
    chipFg: '#7f1d1d',
    border: '#fca5a5',
  },
  {
    role: 'raci_accountable',
    letter: 'A',
    title: '説明責任',
    sub: 'Accountable',
    header: '#ea580c',
    cellBg: '#fff7ed',
    chip: '#fed7aa',
    chipFg: '#7c2d12',
    border: '#fdba74',
  },
  {
    role: 'raci_consulted',
    letter: 'C',
    title: '相談',
    sub: 'Consulted',
    header: '#2563eb',
    cellBg: '#eff6ff',
    chip: '#bfdbfe',
    chipFg: '#1e3a8a',
    border: '#93c5fd',
  },
  {
    role: 'raci_informed',
    letter: 'I',
    title: '報告',
    sub: 'Informed',
    header: '#64748b',
    cellBg: '#f8fafc',
    chip: '#e2e8f0',
    chipFg: '#334155',
    border: '#cbd5e1',
  },
]

interface RACICanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

function AssigneeChip({
  node,
  col,
  onEdit,
  onDragStart,
}: {
  node: StructuredNode
  col: (typeof COLUMNS)[number]
  onEdit: (id: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.label)

  const commit = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== node.label) onEdit(node.id, trimmed)
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
      title="ダブルクリックで編集 / ドラッグでセル移動"
      style={{
        background: col.chip,
        color: col.chipFg,
        border: `1px solid ${col.border}`,
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.45,
        cursor: 'grab',
        wordBreak: 'break-word',
        userSelect: 'none',
      }}
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
            padding: 0,
          }}
          onBlur={commit}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setEditing(false)
              setValue(node.label)
            }
          }}
        />
      ) : (
        node.label
      )}
    </div>
  )
}

function RaciCell({
  row,
  col,
  nodes,
  onEdit,
  onDrop,
  onDragStart,
}: {
  row: RaciRow
  col: (typeof COLUMNS)[number]
  nodes: StructuredNode[]
  onEdit: (id: string, label: string) => void
  onDrop: (nodeId: string, role: RaciAssignmentRole, rowId: string) => void
  onDragStart: (e: React.DragEvent, nodeId: string) => void
}) {
  return (
    <td
      style={{
        verticalAlign: 'top',
        background: col.cellBg,
        borderBottom: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        padding: '10px 12px',
        minWidth: 140,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const nodeId = e.dataTransfer.getData('text/plain')
        if (nodeId) onDrop(nodeId, col.role, row.id)
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 36 }}>
        {nodes.length === 0 ? (
          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>—</span>
        ) : (
          nodes.map((node) => (
            <AssigneeChip
              key={node.id}
              node={node}
              col={col}
              onEdit={onEdit}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </td>
  )
}

export function RACICanvas({ graph, onNodeEdit, onNodeMove }: RACICanvasProps) {
  const rows = useMemo(() => buildRaciRows(graph), [graph])

  const handleDrop = (nodeId: string, role: RaciAssignmentRole, rowId: string) => {
    const parentId = rowId.startsWith('parsed:') || rowId === '__bucket__' ? null : rowId
    onNodeEdit(nodeId, { role, parentId })
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
        overflow: 'auto',
        padding: '24px 20px 32px',
        boxSizing: 'border-box',
        background: '#f1f5f9',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ marginBottom: 14, paddingLeft: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.12em' }}>
          RACI CHART
        </div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
          活動（行）× 責任区分（列）。チップをドラッグしてセルを変更できます。
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            color: '#64748b',
            background: '#fff',
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
          }}
        >
          構造化結果がありません。テキストを入力して「構造化」を実行してください。
        </div>
      ) : (
        <div
          style={{
            overflow: 'auto',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            background: '#fff',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 720,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    background: '#1e293b',
                    color: '#f8fafc',
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    borderRight: '1px solid #334155',
                    minWidth: 160,
                  }}
                >
                  活動 / タスク
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.role}
                    style={{
                      background: col.header,
                      color: '#fff',
                      padding: '12px 10px',
                      textAlign: 'center',
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      minWidth: 140,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.22)',
                        fontSize: 15,
                        fontWeight: 900,
                        marginBottom: 6,
                      }}
                    >
                      {col.letter}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{col.title}</div>
                    <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{col.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <th
                    scope="row"
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      background: rowIndex % 2 === 0 ? '#f8fafc' : '#f1f5f9',
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0',
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      verticalAlign: 'top',
                      lineHeight: 1.5,
                    }}
                  >
                    {row.label}
                  </th>
                  {COLUMNS.map((col) => (
                    <RaciCell
                      key={col.role}
                      row={row}
                      col={col}
                      nodes={row.cells[col.role]}
                      onEdit={handleLabelEdit}
                      onDrop={handleDrop}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && rows[0]?.id === '__bucket__' && (
        <p style={{ marginTop: 12, fontSize: 11, color: '#64748b', paddingLeft: 4 }}>
          ヒント: 「要件定義：田中」のように活動と担当を分けると行が自動分割されます。AIモードでは
          raci_task 行＋ parentId 連携が最適です。
        </p>
      )}
    </div>
  )
}
