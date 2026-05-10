import type { DragEvent } from 'react'

import type { StructuredNode } from '@/types'

interface UnclassifiedItemProps {
  node: StructuredNode
  onDragStart: (id: string) => void
}

export function UnclassifiedItem({ node, onDragStart }: UnclassifiedItemProps) {
  const sourceText =
    typeof node.data?.sourceText === 'string'
      ? node.data.sourceText
      : typeof node.data?.sentence === 'string'
        ? node.data.sentence
        : node.label

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('text/plain', node.id)
    onDragStart(node.id)
  }

  return (
    <article
      className="unclassified-item"
      draggable
      title={sourceText}
      onDragStart={handleDragStart}
    >
      {node.label}
    </article>
  )
}
