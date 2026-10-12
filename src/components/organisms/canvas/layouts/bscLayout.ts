import type { NodeRole } from '@/types'

export type BscHubPosition = 'top' | 'bottom' | 'left' | 'right'

export interface BscPerspective {
  role: NodeRole
  label: string
  focus: string
  exampleKpis: string
  hubPosition: BscHubPosition
  header: string
  bg: string
  chip: string
  chipFg: string
  border: string
}

/** 詳細表の表示順（上→下） */
export const BSC_TABLE_ORDER: BscPerspective[] = [
  {
    role: 'bsc_financial',
    label: '財務',
    focus: '財務パフォーマンス',
    exampleKpis: '投資利益率、営業利益率',
    hubPosition: 'top',
    header: '#16a34a',
    bg: '#f0fdf4',
    chip: '#bbf7d0',
    chipFg: '#14532d',
    border: '#86efac',
  },
  {
    role: 'bsc_customer',
    label: '顧客',
    focus: '顧客満足',
    exampleKpis: '返品率、サービス評価',
    hubPosition: 'left',
    header: '#2563eb',
    bg: '#eff6ff',
    chip: '#bfdbfe',
    chipFg: '#1e3a8a',
    border: '#93c5fd',
  },
  {
    role: 'bsc_process',
    label: '内部プロセス',
    focus: '業務効率',
    exampleKpis: '新製品リードタイム、単位コスト',
    hubPosition: 'right',
    header: '#ea580c',
    bg: '#fff7ed',
    chip: '#fed7aa',
    chipFg: '#7c2d12',
    border: '#fdba74',
  },
  {
    role: 'bsc_learning',
    label: '学習と成長',
    focus: '知識・イノベーション',
    exampleKpis: '従業員定着率、新製品アイデア数',
    hubPosition: 'bottom',
    header: '#7c3aed',
    bg: '#f5f3ff',
    chip: '#ddd6fe',
    chipFg: '#4c1d95',
    border: '#c4b5fd',
  },
]

export const BSC_PERSPECTIVE_MAP = new Map(BSC_TABLE_ORDER.map((p) => [p.role, p]))

export function bscHubGridArea(pos: BscHubPosition): string {
  switch (pos) {
    case 'top':
      return '1 / 2 / 2 / 3'
    case 'bottom':
      return '3 / 2 / 4 / 3'
    case 'left':
      return '2 / 1 / 3 / 2'
    case 'right':
      return '2 / 3 / 3 / 4'
  }
}
