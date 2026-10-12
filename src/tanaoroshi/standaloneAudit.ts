import { COMMON_DOMAINS, CROSS_CUTTING, getIndustries } from './checklist'
import type { IndustryId } from './checklist'
import type { AuditMissingArea, AuditQuestion, AuditReport } from './types'

function matchedKeywords(transcript: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => transcript.includes(keyword))
}

/**
 * スタンドアロン簡易検査。
 * キーワード照合による軸1（業務領域の漏れ）のみ。軸2（深掘り14項目）と曖昧・矛盾検出は
 * 文脈理解が必要なためAI検査に限定する。
 * 判定はすべて「未確認」止まり — 言及なし＝やっていない、とは判定しない（キットの規約）。
 */
export function runStandaloneAudit(transcript: string, industryIds: IndustryId[]): AuditReport {
  const heardTasks: AuditReport['heardTasks'] = []
  const missingAreas: AuditMissingArea[] = []

  for (const domain of COMMON_DOMAINS) {
    const matches = matchedKeywords(transcript, domain.keywords)

    if (matches.length > 0) {
      heardTasks.push({
        task: `${domain.id} ${domain.name}`,
        evidence: `関連キーワードに言及あり: ${matches.join('、')}`,
      })
    } else {
      missingAreas.push({
        area: `${domain.id} ${domain.name}`,
        status: '未確認',
        note: domain.items.join(' / '),
      })
    }
  }

  for (const industry of getIndustries(industryIds)) {
    const matches = matchedKeywords(transcript, industry.keywords)

    if (matches.length > 0) {
      heardTasks.push({
        task: `業種別: ${industry.name}`,
        evidence: `関連キーワードに言及あり: ${matches.join('、')}`,
      })
    } else {
      missingAreas.push({
        area: `業種別: ${industry.name}`,
        status: '未確認',
        note: industry.items.slice(0, 5).join(' / ') + (industry.items.length > 5 ? ' ほか' : ''),
      })
    }
  }

  const questions: AuditQuestion[] = missingAreas.map((area) => ({
    priority: 'Mid' as const,
    text: `「${area.area.replace(/^A\d+ /, '').replace(/^業種別: /, '')}」まわりのお仕事についてまだ伺えていません。このあたりで日々やっている作業はありますか？`,
    source: '2（業務領域の未言及）',
  }))

  for (const check of CROSS_CUTTING) {
    questions.push({
      priority: 'Low',
      text: check.question,
      source: `2（横断観点: ${check.label}）`,
    })
  }

  return {
    heardTasks,
    missingAreas,
    deepDiveGaps: [],
    ambiguities: [],
    questions,
    summary: {
      comment:
        'スタンドアロン簡易検査（キーワード照合）の結果です。検出できるのは業務領域の未言及（軸1）のみで、深掘り14項目の充足チェック（軸2）と曖昧・矛盾の検出はAIモードで実行してください。キーワード一致は「言及の可能性」であり、内容の確認を保証しません。',
      highCount: 0,
    },
  }
}
