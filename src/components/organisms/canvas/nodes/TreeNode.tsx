import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { NodeRole, StructuredNode } from '@/types'

export interface TreeNodeData extends Record<string, unknown> {
  node:                 StructuredNode
  unclassified?:        boolean
  /**
   * 子エッジの接続点 Y 位置（ノード高さに対する割合 [0, 1]）。
   * spanningTreeLayout から渡される。ない場合は右中央 1 本のみ。
   */
  sourceHandlePercents?: number[]
  onEdit?: (nodeId: string, label: string) => void
}

export const ROOT_ROLES = new Set<NodeRole>([
  'root', 'problem', 'theme', 'goal',
  'kgi',
  'wbs_root',
  'issue_root',
  'fishbone_root',
])

export const BRANCH_ROLES = new Set<NodeRole>([
  'cause', 'argument', 'approach', 'category', 'branch',
  'kpi',
  'wbs_phase',
  'issue_branch',
  'fishbone_man', 'fishbone_machine', 'fishbone_material', 'fishbone_method',
])

function getRoleClass(role: NodeRole, unclassified?: boolean): string {
  if (unclassified) return 'tree-node--unclassified'
  if (ROOT_ROLES.has(role))   return 'tree-node--root'
  if (BRANCH_ROLES.has(role)) return 'tree-node--branch'
  return 'tree-node--leaf'
}

function getStyleRole(role: NodeRole, unclassified?: boolean): 'root' | 'branch' | 'leaf' | 'unclassified' {
  if (unclassified || role === 'unclassified') return 'unclassified'
  if (ROOT_ROLES.has(role))   return 'root'
  if (BRANCH_ROLES.has(role)) return 'branch'
  return 'leaf'
}

export function TreeNode({ data, selected }: NodeProps) {
  const nodeData = data as TreeNodeData
  const { node, unclassified, sourceHandlePercents = [], onEdit } = nodeData
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(node.label)

  const confidence    = Number(node.data?.confidence ?? 1)
  const isLowConfidence = confidence < 0.3
  const styleRole     = getStyleRole(node.role, unclassified)

  // 子なし = 最終ノード（リーフ）→ 1行・横幅伸長スタイル
  const isLeaf = sourceHandlePercents.length === 0

  const commit = () => {
    setEditing(false)
    const nextValue = value.trim()
    if (nextValue) onEdit?.(node.id, nextValue)
    else           setValue(node.label)
  }

  return (
    <div
      className={`tree-node sv-node ${getRoleClass(node.role, unclassified)}${isLowConfidence ? ' low-confidence' : ''}`}
      data-role={styleRole}
      data-selected={selected ? 'true' : 'false'}
      title={node.label}
      onDoubleClick={() => setEditing(true)}
      style={{
        width:          '100%',
        height:         '100%',
        minHeight:      0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: isLeaf ? 'flex-start' : 'center',
        boxSizing:      'border-box',
        padding:        '6px 12px',
        overflow:       'hidden',
        // リーフノードは CSS の max-width を無効化して全文1行表示
        ...(isLeaf && { maxWidth: 'none', minWidth: 0 }),
      }}
    >
      {/* ── 左側 Target ハンドル（常に中央 1 本） ── */}
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}
      />

      {/* ── ラベル / 編集入力 ── */}
      {editing ? (
        <input
          autoFocus
          value={value}
          onBlur={commit}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit() }}
          style={{ width: '90%', textAlign: 'center' }}
        />
      ) : (
        <span
          className="sv-node__label"
          style={
            isLeaf
              ? {
                  whiteSpace:  'nowrap',
                  // CSS の text-wrap: balance と word-break: break-word を無効化
                  textWrap:    'nowrap' as React.CSSProperties['textWrap'],
                  wordBreak:   'normal',
                  overflow:    'visible',
                  lineHeight:  1.4,
                  fontSize:    12,
                }
              : { textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.4 }
          }
        >
          {node.label}
        </span>
      )}

      {/* ── 右側 Source ハンドル（子エッジごとに動的配置） ── */}
      {sourceHandlePercents.length > 0 ? (
        sourceHandlePercents.map((pct, i) => (
          <Handle
            key={`src-${i}`}
            id={`src-${i}`}
            type="source"
            position={Position.Right}
            style={{ opacity: 0, pointerEvents: 'none', top: `${pct * 100}%` }}
          />
        ))
      ) : (
        // フォールバック: 子なし or データ未提供時は中央 1 本
        <Handle
          id="src-0"
          type="source"
          position={Position.Right}
          style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}
        />
      )}
    </div>
  )
}
