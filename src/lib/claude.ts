import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export const MODEL = 'llama-3.3-70b-versatile'

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  return response.choices[0]?.message?.content ?? ''
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
