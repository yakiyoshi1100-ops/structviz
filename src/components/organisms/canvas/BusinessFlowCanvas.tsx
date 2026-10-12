import { useState } from 'react'
import { type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// BusinessFlowCanvas — 業務フロー専用キャンバス
// ──────────────────────────────────────────────────────────────────────────────
// レイアウト:
//   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
//   │ 入力 ►│ │ 処理 ►│ │ 判断 ►│ │ 出力 ►│ │ 保管 ►│ │ 共有 │  ← プロセスステップヘッダー
//   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
//     ╭──╮     ┌──┐     ◆──◆     ┌──┐     ╓──╖     ╭──╮
//     │  │     │  │     │  │     │  │     ║  ║     │  │
//     ╰──╯     └──┘     ◆──◆     └──┘     ╙──╜     ╰──╯
//
// 形状: 開始/終了=stadium, タスク=rect, 判断=diamond, 保管=cylinder
// ══════════════════════════════════════════════════════════════════════════════

interface BusinessFlowCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

type FlowShape = 'stadium' | 'rect' | 'diamond' | 'cylinder'

interface StepDef {
  role:  NodeRole
  label: string
  sub:   string
  color: string
  shape: FlowShape
}

const STEPS: StepDef[] = [
  { role: 'flow_input',    label: '入力',  sub: '受付・依頼', color: '#6366f1', shape: 'stadium'  },
  { role: 'flow_process',  label: '処理',  sub: '作業・計算', color: '#3b82f6', shape: 'rect'     },
  { role: 'flow_decision', label: '判断',  sub: '承認・決裁', color: '#f97316', shape: 'diamond'  },
  { role: 'flow_output',   label: '出力',  sub: '作成・発行', color: '#22c55e', shape: 'rect'     },
  { role: 'flow_storage',  label: '保管',  sub: '保存・記録', color: '#64748b', shape: 'cylinder' },
  { role: 'flow_share',    label: '共有',  sub: '報告・連絡', color: '#ec4899', shape: 'stadium'  },
]

// ── プロセスステップ ヘッダーバッジ（chevron chain 対応） ─────────────────────
// 隣接 chevron を zIndex + marginLeft: -16px で重ね合わせ、チェーン風に見せる。
// 左側の notch は「前の矢印の上に乗るので不要」→ 全要素が右矢印形のみ
function StepHeader({ label, sub, color, isLast }: {
  label:   string
  sub:     string
  color:   string
  isLast:  boolean
}) {
  const clipPath = isLast
    ? `polygon(16px 0, 100% 0, 100% 100%, 16px 100%, 0 50%)`              // 最後: 左notch + 右直角
    : `polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)` // 中間: 両notch

  return (
    <div style={{
      background:    color,
      clipPath,
      padding:       '10px 28px',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           2,
      height:        '100%',
    }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.04em' }}>{sub}</span>
    </div>
  )
}

// ── ノード形状 ────────────────────────────────────────────────────────────────
function NodeShape({
  shape, color, label,
  isEditing, editValue, onEdit, onCommit, onChange, onDragStart,
}: {
  shape:       FlowShape
  color:       string
  label:       string
  isEditing:   boolean
  editValue:   string
  onEdit:      () => void
  onCommit:    () => void
  onChange:    (v: string) => void
  onDragStart: (e: React.DragEvent) => void
}) {
  const bg = color + '18'
  const border = `2px solid ${color}`

  const textContent = isEditing ? (
    <input
      autoFocus
      value={editValue}
      style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none',
               font: 'inherit', textAlign: 'center', padding: 0, lineHeight: 'inherit' }}
      onBlur={onCommit}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onCommit() }}
    />
  ) : label

  // ── ダイアモンド ─────────────────────────────────────────────────────────
  if (shape === 'diamond') {
    return (
      <div
        draggable
        onClick={onEdit}
        onDragStart={onDragStart}
        style={{ cursor: 'grab', display: 'flex', justifyContent: 'center', padding: '4px 0' }}
      >
        {/* outer wrapper sets visible width; rotated box = diamond */}
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          {/* diamond background (rotated square) */}
          <div style={{
            position:    'absolute',
            top:         '50%', left: '50%',
            transform:   'translate(-50%, -50%) rotate(45deg)',
            width:        70, height: 70,
            background:  bg,
            border,
            borderRadius: 4,
          }} />
          {/* text layer (counter-rotate) */}
          <div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize:   11,
              fontWeight: 600,
              color:      '#1e293b',
              textAlign:  'center',
              lineHeight: 1.3,
              maxWidth:   72,
              wordBreak:  'break-all',
            }}>
              {textContent}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── シリンダー ───────────────────────────────────────────────────────────
  if (shape === 'cylinder') {
    return (
      <div
        draggable
        onClick={onEdit}
        onDragStart={onDragStart}
        style={{ cursor: 'grab', position: 'relative', marginTop: 8 }}
      >
        {/* top ellipse cap */}
        <div style={{
          position:     'absolute',
          top:          -8,
          left:         0,
          right:        0,
          height:       16,
          background:   color + '30',
          border,
          borderRadius: '50%',
          zIndex:       1,
        }} />
        {/* body */}
        <div style={{
          background:   bg,
          border,
          borderRadius: 4,
          padding:      '12px 10px 8px',
          fontSize:     12,
          fontWeight:   600,
          color:        '#1e293b',
          textAlign:    'center',
          lineHeight:   1.3,
          position:     'relative',
        }}>
          {textContent}
        </div>
        {/* bottom ellipse cap */}
        <div style={{
          position:     'absolute',
          bottom:       -8,
          left:         0,
          right:        0,
          height:       16,
          background:   bg,
          border,
          borderRadius: '50%',
          zIndex:       1,
        }} />
      </div>
    )
  }

  // ── スタジアム（pill）────────────────────────────────────────────────────
  if (shape === 'stadium') {
    return (
      <div
        draggable
        onClick={onEdit}
        onDragStart={onDragStart}
        style={{
          cursor:       'grab',
          background:   bg,
          border,
          borderRadius: 100,
          padding:      '8px 14px',
          fontSize:     12,
          fontWeight:   600,
          color:        '#1e293b',
          textAlign:    'center',
          lineHeight:   1.3,
        }}
      >
        {textContent}
      </div>
    )
  }

  // ── 矩形（デフォルト）────────────────────────────────────────────────────
  return (
    <div
      draggable
      onClick={onEdit}
      onDragStart={onDragStart}
      style={{
        cursor:       'grab',
        background:   bg,
        border,
        borderRadius: 5,
        padding:      '8px 12px',
        fontSize:     12,
        fontWeight:   600,
        color:        '#1e293b',
        textAlign:    'center',
        lineHeight:   1.3,
      }}
    >
      {textContent}
    </div>
  )
}

// ── 1列ボディ (DropZone + ノード) ────────────────────────────────────────────
function StepBody({
  step, nodes,
  editingId, editingValue,
  onStartEdit, onCommit, onChangeValue, onDrop,
}: {
  step:          StepDef
  nodes:         StructuredNode[]
  editingId:     string | null
  editingValue:  string
  onStartEdit:   (n: StructuredNode) => void
  onCommit:      () => void
  onChangeValue: (v: string) => void
  onDrop:        (nodeId: string, role: NodeRole) => void
}) {
  return (
    <div
      style={{
        flex:          '1 1 0',
        minWidth:      0,
        padding:       '8px 4px 4px',
        display:       'flex',
        flexDirection: 'column',
        gap:           step.shape === 'cylinder' ? 22 : 8,
        alignItems:    'stretch',
        minHeight:     60,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id, step.role)
      }}
    >
      {nodes.map((node) => (
        <NodeShape
          key={node.id}
          shape={step.shape}
          color={step.color}
          label={node.label}
          isEditing={editingId === node.id}
          editValue={editingValue}
          onEdit={() => onStartEdit(node)}
          onCommit={onCommit}
          onChange={onChangeValue}
          onDragStart={(e) => e.dataTransfer.setData('text/plain', node.id)}
        />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export function BusinessFlowCanvas({ graph, onNodeEdit, onNodeMove }: BusinessFlowCanvasProps) {
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

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

  return (
    <div style={{
      width:       '100%',
      height:      '100%',
      display:     'flex',
      flexDirection: 'column',
      padding:     '20px 16px',
      boxSizing:   'border-box',
      overflowY:   'auto',
      background:  'var(--color-bg)',
    }}>
      {/* ── プロセス方向ラベル ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            6,
        marginBottom:   10,
        paddingLeft:    4,
        fontSize:       11,
        fontWeight:     700,
        color:          '#94a3b8',
        letterSpacing:  '0.08em',
        textTransform:  'uppercase',
      }}>
        <span>業務プロセス</span>
        <svg width={40} height={10} viewBox="0 0 40 10" fill="none">
          <path d="M0 5 H35 M28 1 L35 5 L28 9" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* ── ヘッダー行（chevron chain: 後の要素が前の要素の上に重なる） ── */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* 最初のコマは右向き矢印形のみ（左直角） */}
        <div style={{
          flex: '1 1 0', minWidth: 0, position: 'relative', zIndex: STEPS.length,
          clipPath: `polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)`,
          background: STEPS[0].color,
          padding: '10px 28px 10px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{STEPS[0].label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.04em' }}>{STEPS[0].sub}</span>
        </div>

        {/* 2～6 番目: marginLeft: -16 で前の矢印先端を覆い、重ねる */}
        {STEPS.slice(1).map((step, idx) => {
          const i      = idx + 1
          const isLast = i === STEPS.length - 1
          return (
            <div
              key={step.role}
              style={{
                flex:      '1 1 0',
                minWidth:  0,
                marginLeft: -16,
                position:  'relative',
                zIndex:    STEPS.length - i,
              }}
            >
              <StepHeader label={step.label} sub={step.sub} color={step.color} isLast={isLast} />
            </div>
          )
        })}
      </div>

      {/* ── ボディ行（ノードドロップゾーン、列幅はヘッダーと1対1対応） ── */}
      <div style={{ display: 'flex', flex: '1 1 auto', alignItems: 'flex-start' }}>
        {STEPS.map((step) => (
          <StepBody
            key={step.role}
            step={step}
            nodes={graph.nodes.filter((n) => n.role === step.role)}
            editingId={editingId}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommit={commitEdit}
            onChangeValue={setEditingValue}
            onDrop={moveToRole}
          />
        ))}
      </div>

      {/* ── 凡例 ── */}
      <div style={{
        marginTop:     20,
        paddingTop:    12,
        borderTop:     '1px solid #e2e8f0',
        display:       'flex',
        gap:           16,
        flexWrap:      'wrap',
        justifyContent: 'center',
      }}>
        {(
          [
            { label: '開始・終了',   shape: 'stadium'  as FlowShape, color: '#6366f1' },
            { label: 'タスク・処理', shape: 'rect'     as FlowShape, color: '#3b82f6' },
            { label: '分岐・判断',   shape: 'diamond'  as FlowShape, color: '#f97316' },
            { label: 'システム・DB', shape: 'cylinder' as FlowShape, color: '#64748b' },
          ] satisfies { label: string; shape: FlowShape; color: string }[]
        ).map(({ label, shape, color }) => (
          <LegendItem key={shape} label={label} shape={shape} color={color} />
        ))}
      </div>
    </div>
  )
}

// ── 凡例アイテム ─────────────────────────────────────────────────────────────
function LegendItem({ label, shape, color }: { label: string; shape: FlowShape; color: string }) {
  const bg = color + '22'
  const border = `1.5px solid ${color}`

  const icon = shape === 'diamond' ? (
    <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        width: 14, height: 14, background: bg, border, borderRadius: 2,
      }} />
    </div>
  ) : shape === 'cylinder' ? (
    <div style={{ width: 20, height: 20, background: bg, border, borderRadius: '3px 3px 0 0', flexShrink: 0,
      boxShadow: `0 -4px 0 0 ${color}30, 0 -4px 0 1.5px ${color}` }} />
  ) : shape === 'stadium' ? (
    <div style={{ width: 28, height: 16, background: bg, border, borderRadius: 100, flexShrink: 0 }} />
  ) : (
    <div style={{ width: 20, height: 16, background: bg, border, borderRadius: 3, flexShrink: 0 }} />
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
    </div>
  )
}
