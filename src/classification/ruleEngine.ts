import type { FrameworkType, NodeRole } from '@/types'

export interface KeywordRule {
  patterns: (string | RegExp)[]
  role: NodeRole
  weight: number
  position?: 'prefix' | 'suffix' | 'anywhere'
  parentRole?: NodeRole
}

export interface FrameworkRuleSet {
  framework: FrameworkType
  rules: KeywordRule[]
  defaultRole: NodeRole
  rootExtraction?: (sentences: string[]) => string
}

export interface ClassificationResult {
  sentence: string
  role: NodeRole
  confidence: number
}

function matchesPattern(sentence: string, pattern: string | RegExp, position = 'anywhere'): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(sentence)
  }

  const normalizedSentence = sentence.toLowerCase()
  const normalizedPattern = pattern.toLowerCase()

  if (position === 'prefix') {
    return normalizedSentence.startsWith(normalizedPattern)
  }

  if (position === 'suffix') {
    return normalizedSentence.endsWith(normalizedPattern)
  }

  return normalizedSentence.includes(normalizedPattern)
}

function matchScore(sentence: string, rule: KeywordRule): number {
  const score = rule.patterns.reduce((total, pattern) => {
    return matchesPattern(sentence, pattern, rule.position) ? total + rule.weight : total
  }, 0)

  return Math.min(score, 1)
}

export const ruleEngine = {
  apply(sentences: string[], ruleSet: FrameworkRuleSet): ClassificationResult[] {
    return sentences.map((sentence) => {
      const bestMatch = ruleSet.rules.reduce<ClassificationResult>(
        (best, rule) => {
          const confidence = matchScore(sentence, rule)

          if (confidence > best.confidence) {
            return {
              sentence,
              role: rule.role,
              confidence,
            }
          }

          return best
        },
        {
          sentence,
          role: ruleSet.defaultRole,
          confidence: 0,
        },
      )

      return bestMatch.confidence > 0
        ? bestMatch
        : {
            sentence,
            role: ruleSet.defaultRole,
            confidence: 0.2,
          }
    })
  },
}
