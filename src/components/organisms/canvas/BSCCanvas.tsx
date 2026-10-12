import { useMemo, useState } from 'react'
import { type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import {
  BSC_TABLE_ORDER,
  bscHubGridArea,
  type BscPerspective,
} from './layouts/bscLayout'

// ══════════════════════════════════════════════════════════════════════════════
// BSC — 1画面構成: ハブ＆スポーク（ビジョンと戦略）＋ 4視点詳細表
// ══════════════════════════════════════════════════════════════════════════════

interface BSCCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

function HubArrows() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 400 280"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker id="bsc-arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
        </marker>
      </defs>
      {/* 中央 (200,140) ↔ 各視点 */}
      <line x1="200" y1="140" x2="200" y2="52" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#bsc-arrow-head)" markerStart="url(#bsc-arrow-head)" />
      <line x1="200" y1="140" x2="200" y2="228" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#bsc-arrow-head)" markerStart="url(#bsc-arrow-head)" />
      <line x1="200" y1="140" x2="72" y2="140" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#bsc-arrow-head)" markerStart="url(#bsc-arrow-head)" />
      <line x1="200" y1="140" x2="328" y2="140" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#bsc-arrow-head)" markerStart="url(#bsc-arrow-head)" />
    </svg>
  )
}

function HubBox({ perspective }: { perspective: BscPerspective }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `2px solid ${perspective.border}`,
        borderRadius: 8,
        padding: '14px 20px',
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 14,
        color: '#0f172a',
        boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
        lineHeight: 1.35,
        zIndex: 1,
      }}
    >
      {perspective.label}
    </div>
  )
}

function KpiChip({
  node,
  perspective,
  onEdit,
  onDragStart,
}: {
  node: StructuredNode
  perspective: BscPerspective
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
    <span
      draggable={!editing}
      onDragStart={(e) => {
        if (!editing) onDragStart(e, node.id)
      }}
      onDoubleClick={() => {
        setEditing(true)
        setValue(node.label)
      }}
      title="ダブルクリックで編集 / ドラッグで視点を移動"
      style={{
        display: 'inline-block',
        background: perspective.chip,
        color: perspective.chipFg,
        border: `1px solid ${perspective.border}`,
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'grab',
        userSelect: 'none',
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={value}
          style={{
            width: 120,
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
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        node.label
      )}
    </span>
  )
}

function DetailTableRow({
  perspective,
  nodes,
  onEdit,
  onMove,
}: {
  perspective: BscPerspective
  nodes: StructuredNode[]
  onEdit: (id: string, label: string) => void
  onMove: (nodeId: string, role: NodeRole) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <tr
      style={{ background: dragOver ? perspective.bg : '#fff' }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const id = e.dataTransfer.getData('text/plain')
        if (id) onMove(id, perspective.role)
      }}
    >
      <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', width: '22%' }}>
        <div
          style={{
            border: `2px solid ${perspective.border}`,
            borderRadius: 6,
            padding: '10px 12px',
            fontWeight: 800,
            fontSize: 13,
            textAlign: 'center',
            background: '#fff',
          }}
        >
          {perspective.label}
        </div>
      </td>
      <td
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #e2e8f0',
          verticalAlign: 'middle',
          fontSize: 13,
          fontWeight: 600,
          color: '#334155',
          width: '28%',
        }}
      >
        {perspective.focus}
      </td>
      <td style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', width: '50%' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: nodes.length > 0 ? 6 : 0 }}>
          例: {perspective.exampleKpis}
        </div>
        <div>
          {nodes.map((node) => (
            <KpiChip
              key={node.id}
              node={node}
              perspective={perspective}
              onEdit={onEdit}
              onDragStart={(e, id) => e.dataTransfer.setData('text/plain', id)}
            />
          ))}
          {nodes.length === 0 && (
            <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
              KPIをドロップ
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

export function BSCCanvas({ graph, onNodeEdit, onNodeMove }: BSCCanvasProps) {
  const grouped = useMemo(() => {
    const m = new Map<NodeRole, StructuredNode[]>(BSC_TABLE_ORDER.map((p) => [p.role, []]))
    graph.nodes.forEach((n) => {
      const list = m.get(n.role as NodeRole)
      if (list) list.push(n)
    })
    return m
  }, [graph.nodes])

  const visionTitle = graph.title?.trim() || 'ビジョンと戦略'
  const visionLines = visionTitle.includes('\n')
    ? visionTitle.split('\n')
    : visionTitle.split(/\s+/).length > 3
      ? [visionTitle.slice(0, Math.floor(visionTitle.length / 2)), visionTitle.slice(Math.floor(visionTitle.length / 2)).trim()]
      : [visionTitle]

  const handleLabelEdit = (nodeId: string, label: string) => {
    onNodeEdit(nodeId, { label })
  }

  const moveToRole = (nodeId: string, role: NodeRole) => {
    onNodeEdit(nodeId, { role })
    onNodeMove(nodeId, { x: 0, y: 0 })
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '20px 24px 28px',
        boxSizing: 'border-box',
        background: '#fff',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 18,
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          バランススコアカードの4視点
        </h2>

        {/* ── 上半: ハブ＆スポーク ── */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gridTemplateRows: 'auto auto auto',
            gap: '8px 12px',
            minHeight: 240,
            marginBottom: 20,
            padding: '8px 12px 16px',
            borderBottom: '3px solid #2563eb',
          }}
        >
          <HubArrows />

          {BSC_TABLE_ORDER.map((p) => (
            <div key={p.role} style={{ gridArea: bscHubGridArea(p.hubPosition), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HubBox perspective={p} />
            </div>
          ))}

          <div
            style={{
              gridArea: '2 / 2 / 3 / 3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '2px solid #334155',
                borderRadius: 10,
                padding: '16px 24px',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: 15,
                color: '#0f172a',
                boxShadow: '0 4px 14px rgba(15,23,42,0.12)',
                lineHeight: 1.4,
                maxWidth: 200,
              }}
            >
              {visionLines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 下半: 4視点詳細表 ── */}
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: 15,
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
          }}
        >
          4視点の詳細
        </h3>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '10px 14px',
                  background: '#dbeafe',
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: 'left',
                  borderBottom: '2px solid #93c5fd',
                }}
              >
                視点
              </th>
              <th
                style={{
                  padding: '10px 14px',
                  background: '#ffedd5',
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: 'left',
                  borderBottom: '2px solid #fdba74',
                }}
              >
                焦点
              </th>
              <th
                style={{
                  padding: '10px 14px',
                  background: '#dcfce7',
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: 'left',
                  borderBottom: '2px solid #86efac',
                }}
              >
                KPI例
              </th>
            </tr>
          </thead>
          <tbody>
            {BSC_TABLE_ORDER.map((p) => (
              <DetailTableRow
                key={p.role}
                perspective={p}
                nodes={grouped.get(p.role) ?? []}
                onEdit={handleLabelEdit}
                onMove={moveToRole}
              />
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          中央はグラフタイトル（ビジョンと戦略）。KPIチップはドラッグで視点を変更できます。
        </p>
      </div>
    </div>
  )
}
