import { useState } from 'react'

import { Badge, Button, IconButton } from '@/components/atoms'
import { useConfigStore } from '@/stores'
import { runAiAudit } from '@/tanaoroshi/aiAudit'
import { INDUSTRY_CHECKLISTS } from '@/tanaoroshi/checklist'
import type { IndustryId } from '@/tanaoroshi/checklist'
import { reportToMarkdown, sortQuestions } from '@/tanaoroshi/reportMarkdown'
import { runStandaloneAudit } from '@/tanaoroshi/standaloneAudit'
import type { AuditMeta, AuditPriority, AuditReport } from '@/tanaoroshi/types'

interface TanaoroshiPanelProps {
  open: boolean
  onClose: () => void
}

const PRIORITY_COLOR: Record<AuditPriority, 'red' | 'blue' | 'gray'> = {
  High: 'red',
  Mid: 'blue',
  Low: 'gray',
}

export function TanaoroshiPanel({ open, onClose }: TanaoroshiPanelProps) {
  const mode = useConfigStore((state) => state.mode)
  const apiKey = useConfigStore((state) => state.apiKey)
  const [transcript, setTranscript] = useState('')
  const [industryIds, setIndustryIds] = useState<IndustryId[]>([])
  const [isAuditing, setIsAuditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [meta, setMeta] = useState<AuditMeta | null>(null)

  const canUseAi = mode === 'ai' && Boolean(apiKey)

  const toggleIndustry = (id: IndustryId) => {
    setIndustryIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }

  const runAudit = async () => {
    if (!transcript.trim()) {
      setError('ヒアリングの文字起こし（またはメモ）を貼り付けてください')
      return
    }

    setError(null)
    setIsAuditing(true)

    const nextMeta: AuditMeta = {
      auditedAt: new Date().toLocaleDateString('ja-JP'),
      industries: INDUSTRY_CHECKLISTS.filter((industry) => industryIds.includes(industry.id)).map(
        (industry) => industry.name,
      ),
      engine: canUseAi ? 'ai' : 'standalone',
    }

    try {
      const result = canUseAi
        ? await runAiAudit(transcript, industryIds, apiKey as string)
        : runStandaloneAudit(transcript, industryIds)
      setReport(result)
      setMeta(nextMeta)
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : String(auditError))
    } finally {
      setIsAuditing(false)
    }
  }

  const downloadMarkdown = () => {
    if (!report || !meta) return

    const blob = new Blob([reportToMarkdown(report, meta)], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `抜け漏れ検出レポート_${meta.auditedAt.replaceAll('/', '-')}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const copyMarkdown = async () => {
    if (!report || !meta) return
    await navigator.clipboard.writeText(reportToMarkdown(report, meta))
  }

  return (
    <>
      <button
        type="button"
        className={`settings-overlay${open ? ' settings-overlay--open' : ''}`}
        aria-label="棚卸し検査パネルを閉じる"
        onClick={onClose}
      />
      <aside
        className={`settings-panel tanaoroshi-panel${open ? ' settings-panel--open' : ''}`}
        aria-hidden={!open}
      >
        <header>
          <h2>棚卸し検査</h2>
          <IconButton icon="×" label="棚卸し検査を閉じる" onClick={onClose} />
        </header>

        <p className="tanaoroshi-description">
          ヒアリングの文字起こしをチェックリストと突合し、聞き漏れ・曖昧な点を質問リストに変換します。
          検出するのは「未確認」までで、確認はご自身がクライアントと行ってください。
        </p>

        <section>
          <h3>1. 文字起こし・ヒアリングメモ</h3>
          <textarea
            className="tanaoroshi-textarea"
            rows={8}
            placeholder="面談の文字起こし、またはヒアリングメモを貼り付け…"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
        </section>

        <section>
          <h3>2. クライアントの業種（複数選択可・共通チェックリストは常に適用）</h3>
          <div className="tanaoroshi-industries">
            {INDUSTRY_CHECKLISTS.map((industry) => (
              <label key={industry.id}>
                <input
                  type="checkbox"
                  checked={industryIds.includes(industry.id)}
                  onChange={() => toggleIndustry(industry.id)}
                />
                <span>{industry.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>3. 検査を実行</h3>
          <p className="tanaoroshi-engine-note">
            {canUseAi
              ? 'AI検査: 業務の漏れ（軸1）＋深掘り14項目（軸2）＋曖昧・矛盾を検出します'
              : 'スタンドアロン簡易検査: キーワード照合で業務領域の漏れ（軸1）のみ検出します。全項目の検査は設定からAIモード（APIキー）を有効にしてください'}
          </p>
          <Button variant="primary" loading={isAuditing} onClick={runAudit}>
            {isAuditing ? '検査中…' : '検査する'}
          </Button>
          {error && <p className="tanaoroshi-error">{error}</p>}
        </section>

        {report && meta && (
          <section className="tanaoroshi-report">
            <h3>
              検査結果{' '}
              <Badge
                label={`High残 ${report.summary.highCount}件`}
                color={report.summary.highCount > 0 ? 'red' : 'green'}
              />
            </h3>
            <p className="tanaoroshi-summary">{report.summary.comment}</p>

            <details open>
              <summary>次回確認の質問リスト（{report.questions.length}問）</summary>
              <ol className="tanaoroshi-questions">
                {sortQuestions(report).map((question, index) => (
                  <li key={index}>
                    <Badge label={question.priority} color={PRIORITY_COLOR[question.priority]} />
                    <span>{question.text}</span>
                  </li>
                ))}
              </ol>
            </details>

            <details>
              <summary>聞き取れた業務（{report.heardTasks.length}件）</summary>
              <ul>
                {report.heardTasks.map((task, index) => (
                  <li key={index}>
                    <strong>{task.task}</strong> — {task.evidence}
                  </li>
                ))}
              </ul>
            </details>

            <details>
              <summary>未言及の業務領域（{report.missingAreas.length}件）</summary>
              <ul>
                {report.missingAreas.map((area, index) => (
                  <li key={index}>
                    <strong>{area.area}</strong>（{area.status}）{area.note ? ` — ${area.note}` : ''}
                  </li>
                ))}
              </ul>
            </details>

            {report.deepDiveGaps.length > 0 && (
              <details>
                <summary>深掘り不足（{report.deepDiveGaps.length}件）</summary>
                <ul>
                  {report.deepDiveGaps.map((gap, index) => (
                    <li key={index}>
                      <Badge label={gap.priority} color={PRIORITY_COLOR[gap.priority]} />
                      <strong>{gap.task}</strong> — 未確認: {gap.missingItems.join('、')}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {report.ambiguities.length > 0 && (
              <details>
                <summary>曖昧・矛盾ポイント（{report.ambiguities.length}件）</summary>
                <ul>
                  {report.ambiguities.map((entry, index) => (
                    <li key={index}>
                      「{entry.statement}」 — {entry.issue}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="tanaoroshi-report-actions">
              <Button variant="secondary" onClick={downloadMarkdown}>
                レポートを保存（.md）
              </Button>
              <Button variant="secondary" onClick={copyMarkdown}>
                Markdownをコピー
              </Button>
            </div>
          </section>
        )}
      </aside>
    </>
  )
}
