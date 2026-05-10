export function tokenize(text: string): string[] {
  const primary = text
    .split(/\r?\n\s{2,}|\r?\n|。|\.(?=\s)|！|？/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)

  const result: string[] = []

  for (const sentence of primary) {
    if (/^[・\-●※▶︎➤◆■□▪︎]/.test(sentence)) {
      result.push(sentence.replace(/^[・\-●※▶︎➤◆■□▪︎]\s*/, ''))
      continue
    }

    if (sentence.length > 50 && sentence.includes('、')) {
      result.push(
        ...sentence
          .split('、')
          .map((subSentence) => subSentence.trim())
          .filter((subSentence) => subSentence.length > 2),
      )
    } else {
      result.push(sentence)
    }
  }

  return result.filter((sentence) => sentence.length > 1)
}
