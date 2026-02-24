import { db } from './firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { nanoid } from 'nanoid'

const CHUNK_SIZE = 60_000 // characters per chunk (~15k tokens, well within 200k context)

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_BUILD = 'You are building a structured argument tree from a text.'
const SYSTEM_EXPAND = 'You are expanding a structured argument tree from additional text.'

function buildFirstPrompt(chunk, rootClaim) {
  return `Extract the central claim being debated and all supporting/opposing arguments from the text below.

Output format — indented tree text (this is the only format accepted):

The root claim (first line, no prefix)
  [FOR] An argument supporting the root
    [FOR] A sub-argument supporting the FOR
    [AGAINST] A counter to that sub-argument
  [AGAINST] An argument opposing the root
    [FOR] A concession or nuance supporting the AGAINST

Rules:
- First line is the root claim, no prefix
- All other lines: 2 spaces per indent level, then [FOR] or [AGAINST], then the argument text
- Nest as deep as the content warrants — there is no depth limit
- Max 300 characters per node
- Only include arguments explicitly present in the text
- Output ONLY the tree, no preamble, no commentary
- If the text contains no discernible central claim or arguments, output only: NO_ARGUMENTS${rootClaim ? `\n- Use this as the root claim (first line): "${rootClaim}"` : ''}

Text to analyze:
---
${chunk}
---`
}

function buildExpandPrompt(chunk, currentTree) {
  return `Current tree:
---
${currentTree}
---

Analyze the following new text and update the tree. You may:
- Add new [FOR] or [AGAINST] children to any existing node
- Add new top-level [FOR]/[AGAINST] arguments directly under the root
- Revise the wording of existing nodes if the new text clarifies or contradicts them

Output the COMPLETE updated tree, no commentary.

New text:
---
${chunk}
---`
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function callGenerate({ apiKey, model, system, prompt }) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error ${res.status}`)
  }
  const { content } = await res.json()
  const result = content.trim()
  console.groupCollapsed(`[treeGenerator] chunk response`)
  console.log('SYSTEM:\n', system)
  console.log('PROMPT:\n', prompt)
  console.log('RESPONSE:\n', result)
  console.groupEnd()
  return result
}

// ─── Main generation loop ─────────────────────────────────────────────────────

export function chunkText(text) {
  const chunks = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }
  return chunks.filter(c => c.trim())
}

// Feeds text through the LLM chunk-by-chunk, building up the tree text.
// onProgress({ stage: 'llm', chunk, total }) is called before each LLM call.
// Returns the final tree text string.
export async function generateTreeText({ text, apiKey, model, rootClaim, onProgress }) {
  const chunks = chunkText(text)
  if (!chunks.length) throw new Error('No text to process')

  let treeText = ''
  for (let i = 0; i < chunks.length; i++) {
    onProgress({ stage: 'llm', chunk: i + 1, total: chunks.length })
    treeText = await callGenerate({
      apiKey,
      model,
      system: i === 0 ? SYSTEM_BUILD : SYSTEM_EXPAND,
      prompt: i === 0
        ? buildFirstPrompt(chunks[i], rootClaim)
        : buildExpandPrompt(chunks[i], treeText),
    })
    if (i === 0 && treeText.trim() === 'NO_ARGUMENTS') {
      throw new Error('NO_ARGUMENTS')
    }
  }
  return treeText
}

// ─── Parse tree text → node tree ─────────────────────────────────────────────

// Returns { text, relation: null, children: [{ text, relation, children }] }
export function parseTreeText(raw) {
  const lines = raw.split('\n').map(l => l.trimEnd()).filter(Boolean)
  if (!lines.length) throw new Error('LLM returned an empty tree')

  const root = { text: lines[0].trim().slice(0, 300), relation: null, children: [] }
  const stack = [{ depth: -1, node: root }]

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const indent = (line.match(/^ */)[0] || '').length
    const depth = Math.round(indent / 2)
    const stripped = line.trimStart()
    if (!stripped.startsWith('[FOR]') && !stripped.startsWith('[AGAINST]')) continue

    const relation = stripped.startsWith('[FOR]') ? 'for' : 'against'
    const text = stripped.replace(/^\[(FOR|AGAINST)\]\s*/, '').slice(0, 300)
    const node = { text, relation, children: [] }

    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop()
    stack[stack.length - 1].node.children.push(node)
    stack.push({ depth, node })
  }

  return root
}

// ─── Write to Firestore ───────────────────────────────────────────────────────

function countChildren(node) {
  let forCount = 0, againstCount = 0
  for (const c of node.children) {
    if (c.relation === 'for') forCount++
    else againstCount++
  }
  return { forCount, againstCount }
}

// Writes a parsed tree to Firestore in parallel. Returns { treeId, rootArgumentId }.
export async function writeTree(parsedRoot, deviceId, username) {
  const treeId = nanoid(10)
  const rootId = nanoid(10)
  const writes = []

  const { forCount, againstCount } = countChildren(parsedRoot)
  writes.push(setDoc(doc(db, 'arguments', rootId), {
    treeId,
    parentId: null,
    parentRelation: null,
    text: parsedRoot.text,
    score: 0,
    forCount,
    againstCount,
    authorDeviceId: deviceId,
    authorUsername: username,
    generated: true,
    createdAt: serverTimestamp(),
  }))

  writes.push(setDoc(doc(db, 'trees', treeId), {
    rootArgumentId: rootId,
    createdAt: serverTimestamp(),
  }))

  function collectWrites(children, parentId) {
    for (const child of children) {
      const id = nanoid(10)
      const { forCount: fc, againstCount: ac } = countChildren(child)
      writes.push(setDoc(doc(db, 'arguments', id), {
        treeId,
        parentId,
        parentRelation: child.relation,
        text: child.text,
        score: 0,
        forCount: fc,
        againstCount: ac,
        authorDeviceId: deviceId,
        authorUsername: username,
        generated: true,
        createdAt: serverTimestamp(),
      }))
      if (child.children.length) collectWrites(child.children, id)
    }
  }

  collectWrites(parsedRoot.children, rootId)
  await Promise.all(writes)

  return { treeId, rootArgumentId: rootId }
}
