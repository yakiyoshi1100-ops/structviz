const CLAUDE_MESSAGES_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-6'
const JSON_PARSE_MAX_RETRIES = 2
const JSON_PARSE_RETRY_DELAY_MS = 500

interface ClaudeClientParams {
  apiKey: string
  systemPrompt: string
  userPrompt: string
  signal?: AbortSignal
}

interface ClaudeTextBlock {
  type: 'text'
  text: string
}

interface ClaudeMessagesResponse {
  content: ClaudeTextBlock[]
}

export class ClaudeApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ClaudeApiError'
    this.statusCode = statusCode
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string }; message?: string }
    return data.error?.message ?? data.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

function repairJSON(raw: string): string {
  let s = raw.trim()

  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  const firstBrace = s.indexOf('{')
  const lastBrace = s.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1)
  }

  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  s = s.replace(/([{,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '$1"$2":')
  s = s.replace(/,(\s*[}\]])/g, '$1')

  return s
}

function parseJsonFromText(text: string): unknown {
  return JSON.parse(repairJSON(text))
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
      return
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, ms)

    function handleAbort() {
      window.clearTimeout(timer)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

async function requestClaudeText({
  apiKey,
  systemPrompt,
  userPrompt,
  signal,
}: ClaudeClientParams): Promise<string> {
  const response = await fetch(CLAUDE_MESSAGES_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new ClaudeApiError(await readErrorMessage(response), response.status)
  }

  const data = (await response.json()) as ClaudeMessagesResponse
  const text = data.content.find((block) => block.type === 'text')?.text

  if (!text) {
    throw new ClaudeApiError('Claude response did not contain a text block.', response.status)
  }

  return text
}

export async function claudeClient(params: ClaudeClientParams): Promise<unknown> {
  for (let attempt = 0; attempt <= JSON_PARSE_MAX_RETRIES; attempt += 1) {
    const text = await requestClaudeText(params)

    try {
      return parseJsonFromText(text)
    } catch (error) {
      console.warn(
        `[Claude] JSONパース失敗 (試行${attempt + 1}/${JSON_PARSE_MAX_RETRIES + 1}):`,
        error,
      )

      if (attempt < JSON_PARSE_MAX_RETRIES) {
        await delay(JSON_PARSE_RETRY_DELAY_MS, params.signal)
      }
    }
  }

  throw new Error('AI応答の解析に失敗しました。もう一度お試しください')
}
