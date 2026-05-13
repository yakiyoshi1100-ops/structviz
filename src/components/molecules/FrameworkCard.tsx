import type { FrameworkDefinition, FrameworkType } from '@/types'

import { Badge } from '@/components/atoms'

interface FrameworkCardProps {
  definition: FrameworkDefinition
  active: boolean
  collapsed?: boolean
  onClick: (type: FrameworkType) => void
}

const categoryClassMap: Record<FrameworkDefinition['category'], string> = {
  論理構造: 'logic',
  戦略分析: 'strategy',
  論理展開: 'reasoning',
  業務改善: 'improvement',
  '品質・論理': 'quality',
  プロジェクト管理: 'project',
}

export function FrameworkCard({
  definition,
  active,
  collapsed = false,
  onClick,
}: FrameworkCardProps) {
  return (
    <button
      type="button"
      className={`framework-card framework-card--category-${categoryClassMap[definition.category]}${active ? ' framework-card--active' : ''}${collapsed ? ' framework-card--collapsed' : ''}`}
      title={definition.label}
      onClick={() => onClick(definition.type)}
    >
      <span className="framework-card-icon">{definition.icon}</span>
      {!collapsed && (
        <>
          <span>{definition.label}</span>
          <small>{definition.description}</small>
          <Badge label={definition.category} color={active ? 'blue' : 'gray'} />
        </>
      )}
    </button>
  )
}
