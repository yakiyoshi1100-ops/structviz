import type { ReactNode } from 'react'

import { FrameworkCard } from '@/components/molecules'
import { FRAMEWORK_REGISTRY, FrameworkType } from '@/types'

interface FrameworkSidebarProps {
  active: FrameworkType | null
  collapsed?: boolean
  onSelect: (framework: FrameworkType) => void
  onToggleCollapse?: () => void
  footer?: ReactNode
}

const sections = [
  {
    label: '論理構造',
    frameworks: [
      FrameworkType.WHY_TREE,
      FrameworkType.WHAT_TREE,
      FrameworkType.HOW_TREE,
      FrameworkType.MECE,
      FrameworkType.YWT,
    ],
  },
  {
    label: '戦略分析',
    frameworks: [
      FrameworkType.THREE_C,
      FrameworkType.SWOT,
      FrameworkType.PEST,
      FrameworkType.ANSOFF,
      FrameworkType.CROSS_SWOT,
      FrameworkType.PRIORITY_MATRIX,
      FrameworkType.AS_IS_TO_BE,
      FrameworkType.STP,
      FrameworkType.PPM,
      FrameworkType.BSC,
      FrameworkType.KPI,
      FrameworkType.ABC,
    ],
  },
  {
    label: '論理展開',
    frameworks: [FrameworkType.PYRAMID, FrameworkType.DEDUCTION, FrameworkType.INDUCTION],
  },
  {
    label: '業務改善',
    frameworks: [
      FrameworkType.PHENOMENON_TO_ACTION,
      FrameworkType.BUSINESS_FLOW,
      FrameworkType.ECRS,
      FrameworkType.SPIN,
      FrameworkType.CUSTOMER_JOURNEY,
      FrameworkType.VSM,
    ],
  },
  {
    label: '品質・論理',
    frameworks: [
      FrameworkType.FOUR_M,
      FrameworkType.QCD,
      FrameworkType.FISHBONE,
      FrameworkType.ISSUE_TREE,
      FrameworkType.DMAIC,
    ],
  },
  {
    label: 'プロジェクト管理',
    frameworks: [FrameworkType.RACI, FrameworkType.WBS],
  },
]

export function FrameworkSidebar({
  active,
  collapsed = false,
  onSelect,
  onToggleCollapse,
  footer,
}: FrameworkSidebarProps) {
  return (
    <aside className={`framework-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      <button
        type="button"
        className="framework-sidebar-toggle"
        title={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        onClick={onToggleCollapse}
      >
        {collapsed ? '▶' : '◀'}
      </button>
      <div className="framework-sidebar-list">
        {sections.map((section) => (
          <section key={section.label} className="framework-section">
            {!collapsed && <h2>{section.label}</h2>}
            <div className="framework-list">
              {section.frameworks.map((framework) => (
                <FrameworkCard
                  key={framework}
                  definition={FRAMEWORK_REGISTRY[framework]}
                  active={active === framework}
                  collapsed={collapsed}
                  onClick={onSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {!collapsed && footer && <div className="framework-sidebar-footer">{footer}</div>}
    </aside>
  )
}
