import type { FrameworkGraph } from '@/types'

export function renderUserTemplate(text: string, previous?: FrameworkGraph): string {
  const sections = [
    '以下の入力テキストを指定フレームワークのノード構造へ分類してください。',
    '',
    '入力テキスト:',
    text,
  ]

  if (previous) {
    sections.push(
      '',
      '既存の構造（差分追加対象）:',
      JSON.stringify(previous, null, 2),
    )
  }

  sections.push('', 'JSONのみを返してください。マークダウンのコードフェンスは不要です。')

  return sections.join('\n')
}
