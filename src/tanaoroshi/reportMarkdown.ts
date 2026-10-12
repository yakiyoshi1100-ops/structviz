import type { AuditMeta, AuditReport } from './types'

const PRIORITY_ORDER = { High: 0, Mid: 1, Low: 2 } as const

export function sortQuestions(report: AuditReport): AuditReport['questions'] {
  return [...report.questions].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )
}

/** キットの「抜け漏れ検出レポート」テンプレートに準拠したMarkdownを生成する */
export function reportToMarkdown(report: AuditReport, meta: AuditMeta): string {
  const lines: string[] = [
    '# 抜け漏れ検出レポート',
    '',
    `検査日: ${meta.auditedAt} / 業種（適用チェックリスト）: 共通${meta.industries.length > 0 ? '＋' + meta.industries.join('＋') : 'のみ'} / エンジン: ${meta.engine === 'ai' ? 'AI検査' : 'スタンドアロン簡易検査（軸1のみ）'}`,
    '',
    '## 1. 聞き取れた業務一覧',
    '',
    '| 業務 | 発言根拠 |',
    '| :--- | :--- |',
    ...report.heardTasks.map((task) => `| ${task.task} | ${task.evidence} |`),
    '',
    '## 2. 未言及の業務領域（業務の漏れ・軸1）',
    '',
    '| チェックリスト領域 | 状態 | 備考 |',
    '| :--- | :--- | :--- |',
    ...report.missingAreas.map((area) => `| ${area.area} | ${area.status} | ${area.note ?? ''} |`),
    '',
    '## 3. 深掘り不足（項目の漏れ・軸2）',
    '',
  ]

  if (report.deepDiveGaps.length > 0) {
    lines.push(
      '| 業務 | 未確認の項目 | 優先度 |',
      '| :--- | :--- | :--- |',
      ...report.deepDiveGaps.map(
        (gap) => `| ${gap.task} | ${gap.missingItems.join('、')} | ${gap.priority} |`,
      ),
    )
  } else {
    lines.push(
      meta.engine === 'ai' ? '（検出なし）' : '（スタンドアロン簡易検査では対象外。AI検査で実行してください）',
    )
  }

  lines.push('', '## 4. 曖昧・矛盾ポイント', '')

  if (report.ambiguities.length > 0) {
    lines.push(
      '| 発言（要約） | 何が曖昧/矛盾か |',
      '| :--- | :--- |',
      ...report.ambiguities.map((entry) => `| ${entry.statement} | ${entry.issue} |`),
    )
  } else {
    lines.push(
      meta.engine === 'ai' ? '（検出なし）' : '（スタンドアロン簡易検査では対象外。AI検査で実行してください）',
    )
  }

  lines.push(
    '',
    '## 5. 次回確認の質問リスト（優先度順）',
    '',
    '| # | 優先度 | 質問文 | 出どころ |',
    '| :--- | :--- | :--- | :--- |',
    ...sortQuestions(report).map(
      (question, index) =>
        `| ${index + 1} | ${question.priority} | ${question.text} | ${question.source} |`,
    ),
    '',
    '## 6. 検査サマリー',
    '',
    `- ${report.summary.comment}`,
    `- High優先の残数: ${report.summary.highCount}件（ゼロになったら棚卸し完了の目安）`,
    '',
  )

  return lines.join('\n')
}
