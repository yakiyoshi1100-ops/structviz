import type { FrameworkGraph, NodeRole, StructuredNode } from '@/types'

export const RACI_ASSIGNMENT_ROLES = [
  'raci_responsible',
  'raci_accountable',
  'raci_consulted',
  'raci_informed',
] as const

export type RaciAssignmentRole = (typeof RACI_ASSIGNMENT_ROLES)[number]

export function isRaciAssignmentRole(role: NodeRole): role is RaciAssignmentRole {
  return (RACI_ASSIGNMENT_ROLES as readonly string[]).includes(role)
}

export interface RaciRow {
  id: string
  label: string
  cells: Record<RaciAssignmentRole, StructuredNode[]>
}

const LABEL_SEPARATORS = ['：', ':', '｜', '|', ' — ', ' - ', '／', '/'] as const

function parseActivityAssignee(label: string): { activity: string; assignee: string } | null {
  for (const sep of LABEL_SEPARATORS) {
    const idx = label.indexOf(sep)
    if (idx <= 0) continue
    const activity = label.slice(0, idx).trim()
    const assignee = label.slice(idx + sep.length).trim()
    if (activity && assignee) return { activity, assignee }
  }
  return null
}

function emptyCells(): Record<RaciAssignmentRole, StructuredNode[]> {
  return {
    raci_responsible: [],
    raci_accountable: [],
    raci_consulted: [],
    raci_informed: [],
  }
}

function rowFromTask(
  task: StructuredNode,
  nodes: StructuredNode[],
): RaciRow {
  const cells = emptyCells()
  for (const role of RACI_ASSIGNMENT_ROLES) {
    cells[role] = nodes.filter((n) => n.parentId === task.id && n.role === role)
  }
  return { id: task.id, label: task.label, cells }
}

function rowsFromParentLinks(nodes: StructuredNode[]): RaciRow[] {
  const assignments = nodes.filter((n) => isRaciAssignmentRole(n.role) && n.parentId)
  const parentIds = [...new Set(assignments.map((n) => n.parentId as string))]

  return parentIds.map((parentId) => {
    const parent = nodes.find((n) => n.id === parentId)
    return rowFromTask(
      parent ?? { id: parentId, role: 'raci_task', label: '活動', parentId: null, position: { x: 0, y: 0 } },
      nodes,
    )
  })
}

function rowsFromParsedLabels(nodes: StructuredNode[]): RaciRow[] {
  const rowMap = new Map<string, RaciRow>()

  for (const node of nodes.filter((n) => isRaciAssignmentRole(n.role))) {
    const parsed = parseActivityAssignee(node.label)
    if (!parsed) continue

    let row = rowMap.get(parsed.activity)
    if (!row) {
      row = { id: `parsed:${parsed.activity}`, label: parsed.activity, cells: emptyCells() }
      rowMap.set(parsed.activity, row)
    }

    if (!isRaciAssignmentRole(node.role)) continue
    row.cells[node.role].push({
      ...node,
      label: parsed.assignee,
    })
  }

  return [...rowMap.values()]
}

function rowFromRoleBuckets(nodes: StructuredNode[]): RaciRow[] {
  const cells = emptyCells()
  for (const role of RACI_ASSIGNMENT_ROLES) {
    cells[role] = nodes.filter((n) => n.role === role)
  }
  return [{ id: '__bucket__', label: '活動（一覧）', cells }]
}

/** グラフから RACI 表の行データを構築する */
export function buildRaciRows(graph: FrameworkGraph): RaciRow[] {
  const { nodes } = graph
  const tasks = nodes.filter((n) => n.role === 'raci_task')

  if (tasks.length > 0) {
    return tasks.map((task) => rowFromTask(task, nodes))
  }

  const fromParents = rowsFromParentLinks(nodes)
  if (fromParents.length > 0) return fromParents

  const fromParsed = rowsFromParsedLabels(nodes)
  if (fromParsed.length > 0) return fromParsed

  const assignments = nodes.filter((n) => isRaciAssignmentRole(n.role))
  if (assignments.length === 0) return []

  return rowFromRoleBuckets(assignments)
}
