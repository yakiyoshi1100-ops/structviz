import { Badge } from '@/components/atoms'
import { UnclassifiedItem } from '@/components/molecules'
import type { NodeRole, StructuredNode } from '@/types'

interface UnclassifiedBufferProps {
  nodes: StructuredNode[]
  onDropToCanvas: (id: string, role: NodeRole) => void
}

export function UnclassifiedBuffer({ nodes, onDropToCanvas }: UnclassifiedBufferProps) {
  return (
    <aside
      className="unclassified-buffer"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const nodeId = event.dataTransfer.getData('text/plain')

        if (nodeId) {
          onDropToCanvas(nodeId, 'leaf')
        }
      }}
    >
      <header>
        <span>未分類バッファ</span>
        <Badge label={String(nodes.length)} color={nodes.length > 0 ? 'blue' : 'gray'} />
      </header>
      {nodes.length === 0 ? (
        <p>未分類なし</p>
      ) : (
        <div className="unclassified-list">
          {nodes.map((node) => (
            <UnclassifiedItem key={node.id} node={node} onDragStart={() => undefined} />
          ))}
        </div>
      )}
    </aside>
  )
}
