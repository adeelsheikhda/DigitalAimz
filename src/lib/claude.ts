import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = 'claude-sonnet-4-6'

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

export async function runAgentJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<T> {
  const text = await runAgent(
    systemPrompt + '\n\nALWAYS respond with valid JSON only. No markdown, no explanation.',
    userMessage,
    maxTokens
  )

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}
