import { useState } from 'react'

import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'
import { getMatrixConfig } from './layouts/matrixLayout'

interface MatrixCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

export function MatrixCanvas({ graph, onNodeEdit, onNodeMove }: MatrixCanvasProps) {
  const config = getMatrixConfig(graph.frameworkType)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const startEdit = (node: StructuredNode) => {
    setEditingId(node.id)
    setEditingValue(node.label)
  }

  const commitEdit = () => {
    if (editingId && editingValue.trim()) {
      onNodeEdit(editingId, { label: editingValue.trim() })
    }

    setEditingId(null)
  }

  const moveToRole = (nodeId: string, role: NodeRole) => {
    onNodeEdit(nodeId, { role })
    onNodeMove(nodeId, { x: 0, y: 0 })
  }

  return (
    <div
      className="matrix-canvas"
      style={{
        gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
      }}
    >
      {config.cells.flat().map((cell) => {
        const nodes = graph.nodes.filter((node) => node.role === cell.role)

        return (
          <section
            key={cell.role}
            className="matrix-cell"
            style={{ '--cell-color': cell.color } as React.CSSProperties}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const nodeId = event.dataTransfer.getData('text/plain')

              if (nodeId) {
                moveToRole(nodeId, cell.role)
              }
            }}
          >
            <h2 className="matrix-cell-label">{cell.label}</h2>
            <div className="matrix-node-list">
              {nodes.map((node) => (
                <article
                  key={node.id}
                  className="matrix-node"
                  draggable
                  onClick={() => startEdit(node)}
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', node.id)}
                >
                  {editingId === node.id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onBlur={commitEdit}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          commitEdit()
                        }
                      }}
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
}
