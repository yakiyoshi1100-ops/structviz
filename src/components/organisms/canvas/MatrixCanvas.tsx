import { useState } from 'react'

import { FrameworkType, type FrameworkGraph, type NodeRole, type StructuredNode } from '@/types'
import { getMatrixConfig } from './layouts/matrixLayout'

interface MatrixCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
  onNodeMove: (nodeId: string, position: StructuredNode['position']) => void
}

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
  return {
    title,
    sub: rest.length > 0 ? rest.join(' / ') : undefined,
  }
}

export function MatrixCanvas({ graph, onNodeEdit, onNodeMove }: MatrixCanvasProps) {
  const config = getMatrixConfig(graph.frameworkType)
  const [editingId, setEditingId] = useState<string | null>(null)
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
      className={`matrix-canvas sv-matrix framework-visual framework-visual--${variant}`}
      style={{
        gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
      }}
    >
      {variant === 'quadrant' && (
        <>
          <span className="matrix-axis matrix-axis--x">外部 / 市場</span>
          <span className="matrix-axis matrix-axis--y">内部 / 製品</span>
        </>
      )}
      {config.cells.flat().map((cell, index) => {
        const nodes = graph.nodes.filter((node) => node.role === cell.role)
        const label = splitCellLabel(cell.label)

        return (
          <section
            key={cell.role}
            className={`matrix-cell sv-cell framework-cell framework-cell--${variant}`}
            data-tint={(index % TINT_COUNT) + 1}
            style={{ '--cell-color': cell.color } as React.CSSProperties}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const nodeId = event.dataTransfer.getData('text/plain')

              if (nodeId) {
                moveToRole(nodeId, cell.role)
              }
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
