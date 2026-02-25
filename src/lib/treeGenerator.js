import { db } from './firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { nanoid } from 'nanoid'

const CHUNK_SIZE = 60_000 // characters per chunk (~15k tokens, well within 200k context)

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_BUILD = 'You are building a structured argument tree from a text.'
const SYSTEM_EXPAND = 'You are expanding a structured argument tree from additional text.'
const SYSTEM_SOURCES = 'You are building a structured argument tree by extracting and organising arguments from a collection of sourced texts.'

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

function buildSourcesPrompt(sources, rootClaim) {
  const entries = sources.map((s, i) =>
    `[${i}] URL: ${s.url}\n${s.text}`
  ).join('\n\n')

  return `Read the following sourced texts and extract arguments to build a structured argument tree.

Output format — indented tree text:

The root claim (first line, no prefix)
  [FOR] A supporting argument derived from the sources [SRC=N]
    [FOR] A sub-argument [SRC=N]
    [AGAINST] A counter-argument [SRC=N]
  [AGAINST] An opposing argument [SRC=N]

Rules:
- First line is the root claim, no prefix, no [SRC=...] tag
- All other lines: 2 spaces per indent level, then [FOR] or [AGAINST], then the argument text, then [SRC=N]
- Derive concise argument nodes from the content of each source text — do not copy verbatim
- Every non-root node MUST end with a [SRC=N] tag citing the index of the source it was derived from
- To cite multiple sources for one node use [SRC=0,3] — comma-separated, no spaces
- Never create a node you cannot attribute to a source
- Nest as deep as the content warrants
- Max 300 characters per node (not counting the [SRC=...] tag)
- Output ONLY the tree, no preamble, no commentary
- If no coherent argument tree can be formed, output only: NO_ARGUMENTS${rootClaim ? `\n- Use this as the root claim (first line): "${rootClaim}"` : ''}

Source texts:
${entries}`
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

// Generates a tree from structured sources (array of { argument, url, quote }).
// Each non-root node in the output is tagged with [SRC=N] by the LLM.
// Returns the raw tree text string.
export async function generateTreeFromSources({ sources, apiKey, model, rootClaim, onProgress }) {
  if (!sources.length) throw new Error('No sources to process')
  onProgress({ chunk: 1, total: 1 })
  const treeText = await callGenerate({
    apiKey,
    model,
    system: SYSTEM_SOURCES,
    prompt: buildSourcesPrompt(sources, rootClaim),
  })
  if (treeText.trim() === 'NO_ARGUMENTS') throw new Error('NO_ARGUMENTS')
  return treeText
}

// ─── Parse tree text → node tree ─────────────────────────────────────────────

// Returns { text, relation: null, srcIndices: [], children: [...] }
// srcIndices is populated from [SRC=N] or [SRC=0,3] tags emitted by the LLM.
export function parseTreeText(raw) {
  const lines = raw.split('\n').map(l => l.trimEnd()).filter(Boolean)
  if (!lines.length) throw new Error('LLM returned an empty tree')

  const root = { text: lines[0].trim().slice(0, 300), relation: null, srcIndices: [], children: [] }
  const stack = [{ depth: -1, node: root }]

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const indent = (line.match(/^ */)[0] || '').length
    const depth = Math.round(indent / 2)
    const stripped = line.trimStart()
    if (!stripped.startsWith('[FOR]') && !stripped.startsWith('[AGAINST]')) continue

    const relation = stripped.startsWith('[FOR]') ? 'for' : 'against'
    const afterTag = stripped.replace(/^\[(FOR|AGAINST)\]\s*/, '')
    const srcMatch = afterTag.match(/\[SRC=([\d,]+)\]/)
    const srcIndices = srcMatch ? srcMatch[1].split(',').map(Number) : []
    const text = afterTag.replace(/\s*\[SRC=[\d,]+\]/, '').trim().slice(0, 300)
    const node = { text, relation, srcIndices, children: [] }

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
// sourcesData: optional array of { url, text } from a JSON upload.
// When provided, source docs are written for nodes that carry srcIndices.
export async function writeTree(parsedRoot, deviceId, username, sourcesData = null) {
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

  function addSourceWrites(argumentId, srcIndices) {
    if (!sourcesData || !srcIndices?.length) return
    for (const idx of srcIndices) {
      const src = sourcesData[idx]
      if (!src) continue
      writes.push(setDoc(doc(db, 'sources', nanoid(10)), {
        argumentId,
        url: src.url,
        quote: '',
        addedByDeviceId: deviceId,
        createdAt: serverTimestamp(),
      }))
    }
  }

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
      addSourceWrites(id, child.srcIndices)
      if (child.children.length) collectWrites(child.children, id)
    }
  }

  collectWrites(parsedRoot.children, rootId)
  await Promise.all(writes)

  return { treeId, rootArgumentId: rootId }
}
