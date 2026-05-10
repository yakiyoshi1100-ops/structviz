const CLAUDE_MESSAGES_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

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

function parseJsonFromText(text: string): unknown {
  return JSON.parse(text)
}

export async function claudeClient({
  apiKey,
  systemPrompt,
  userPrompt,
  signal,
}: ClaudeClientParams): Promise<unknown> {
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
      max_tokens: 4096,
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

  return parseJsonFromText(text)
}
