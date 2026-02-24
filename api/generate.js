import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { apiKey, model, system, messages } = req.body
  if (!apiKey || !messages) return res.status(400).json({ error: 'Missing apiKey or messages' })

  try {
    const client = new Anthropic({ apiKey })
    const result = await client.messages.create({
      model: model || 'claude-sonnet-4-6',
      max_tokens: 8192,
      system,
      messages,
    })
    res.json({ content: result.content[0].text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
