export type AuditPriority = 'High' | 'Mid' | 'Low'

export type AuditAreaStatus = '未確認' | '該当しない可能性あり・要確認' | '一部言及'

export interface AuditHeardTask {
  task: string
  evidence: string
}

export interface AuditMissingArea {
  area: string
  status: AuditAreaStatus
  note?: string
}

export interface AuditDeepDiveGap {
  task: string
  missingItems: string[]
  priority: AuditPriority
}

export interface AuditAmbiguity {
  statement: string
  issue: string
}

export interface AuditQuestion {
  priority: AuditPriority
  text: string
  source: string
}

export interface AuditReport {
  heardTasks: AuditHeardTask[]
  missingAreas: AuditMissingArea[]
  deepDiveGaps: AuditDeepDiveGap[]
  ambiguities: AuditAmbiguity[]
  questions: AuditQuestion[]
  summary: {
    comment: string
    highCount: number
  }
}

export interface AuditMeta {
  auditedAt: string
  industries: string[]
  engine: 'standalone' | 'ai'
}
