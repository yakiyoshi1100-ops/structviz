import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { NodeRole, StructuredNode } from '@/types'

export interface TreeNodeData extends Record<string, unknown> {
  node: StructuredNode
  unclassified?: boolean
  onEdit?: (nodeId: string, label: string) => void
}

function getRoleClass(role: NodeRole, unclassified?: boolean): string {
  if (unclassified) {
    return 'tree-node--unclassified'
  }

  if (role === 'root' || role === 'problem' || role === 'theme' || role === 'goal') {
    return 'tree-node--root'
  }

  if (role === 'cause' || role === 'argument' || role === 'approach' || role === 'category') {
    return 'tree-node--branch'
  }

  return 'tree-node--leaf'
}

export function TreeNode({ data }: NodeProps) {
  const nodeData = data as TreeNodeData
  const { node, unclassified, onEdit } = nodeData
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.label)
  const confidence = Number(node.data?.confidence ?? 1)
  const isLowConfidence = confidence < 0.3

  const commit = () => {
    setEditing(false)
    const nextValue = value.trim()

    if (nextValue) {
      onEdit?.(node.id, nextValue)
    } else {
      setValue(node.label)
    }
  }

  return (
    <div
      className={`tree-node ${getRoleClass(node.role, unclassified)}${isLowConfidence ? ' low-confidence' : ''}`}
      onDoubleClick={() => setEditing(true)}
    >
      <Handle type="target" position={Position.Top} />
      <small>{node.role}</small>
      {editing ? (
        <input
          autoFocus
          value={value}
          onBlur={commit}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commit()
            }
          }}
        />
      ) : (
        <span>{node.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
