import type { FrameworkGraph, StructuredNode } from '@/types'

interface PyramidCanvasProps {
  graph: FrameworkGraph
  onNodeEdit: (nodeId: string, patch: Partial<Omit<StructuredNode, 'id'>>) => void
}

const ROLE_ORDER = ['conclusion', 'argument', 'evidence', 'root', 'branch', 'leaf']

function groupNodes(nodes: StructuredNode[]): StructuredNode[][] {
  const conclusion = nodes.filter((node) => ['conclusion', 'root'].includes(node.role))
  const arguments_ = nodes.filter((node) => ['argument', 'branch'].includes(node.role))
  const evidence = nodes.filter((node) => ['evidence', 'leaf'].includes(node.role))
  const used = new Set([...conclusion, ...arguments_, ...evidence].map((node) => node.id))
  const rest = nodes
    .filter((node) => !used.has(node.id))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))

  return [
    conclusion.length > 0 ? conclusion : nodes.slice(0, 1),
    arguments_.length > 0 ? arguments_ : rest.slice(0, 3),
    evidence.length > 0 ? evidence : rest.slice(3),
  ].filter((group) => group.length > 0)
}

export function PyramidCanvas({ graph, onNodeEdit }: PyramidCanvasProps) {
  const levels = groupNodes(graph.nodes)

  return (
    <div className="pyramid-canvas">
      <div className="pyramid-stage">
        {levels.map((nodes, index) => (
          <section
            key={index}
            className="pyramid-level"
            style={{ '--level': index, '--level-count': levels.length } as React.CSSProperties}
          >
            <header>{index === 0 ? '結論' : index === 1 ? '根拠' : '事実・データ'}</header>
            <div className="pyramid-level-items">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="pyramid-node"
                  title="クリックで編集"
                  onClick={() => {
                    const next = window.prompt('ノードを編集', node.label)
                    if (next?.trim()) onNodeEdit(node.id, { label: next.trim() })
                  }}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
