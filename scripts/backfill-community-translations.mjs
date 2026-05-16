import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const repoRoot = process.cwd()
const defaultModelCandidates = ['gemini-2.5-flash', 'gemini-1.5-flash']

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key]) continue

    let value = rawValue.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

function loadLocalEnv() {
  loadEnvFile(path.join(repoRoot, '.env.local'))
  loadEnvFile(path.join(repoRoot, '.env'))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const parsedLimit = limitArg ? Number(limitArg.slice('--limit='.length)) : undefined

  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : undefined,
  }
}

function unique(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function readGeminiKey() {
  const envKey = process.env.GEMINI_API_KEY?.trim()
  if (envKey) return envKey

  const keyPath = path.join(repoRoot, 'gemini.key')
  if (!existsSync(keyPath)) return null

  return readFileSync(keyPath, 'utf8').trim() || null
}

function getGeminiModelCandidates() {
  return unique([process.env.GEMINI_MODEL ?? '', ...defaultModelCandidates])
}

function extractTextFromGeminiResponse(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? []
  return parts.map((part) => part.text ?? '').join('').trim()
}

function parseJsonText(text) {
  try {
    return JSON.parse(text)
  } catch {
    const objStart = text.indexOf('{')
    const objEnd = text.lastIndexOf('}')
    const arrStart = text.indexOf('[')
    const arrEnd = text.lastIndexOf(']')
    if (arrStart >= 0 && arrEnd > arrStart && (arrStart < objStart || objStart < 0)) {
      return JSON.parse(text.slice(arrStart, arrEnd + 1))
    }
    if (objStart >= 0 && objEnd > objStart) return JSON.parse(text.slice(objStart, objEnd + 1))
    throw new Error('Gemini did not return parseable JSON.')
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryDelay(errorBody) {
  try {
    const parsed = JSON.parse(errorBody)
    const retryInfo = parsed?.error?.details?.find((d) => d['@type']?.endsWith('RetryInfo'))
    if (retryInfo?.retryDelay) {
      const seconds = parseInt(retryInfo.retryDelay, 10)
      if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
    }
  } catch {}
  return 60_000
}

async function generateGeminiJson({ apiKey, prompt, schema, temperature = 0.1 }) {
  let lastError = null

  for (const model of getGeminiModelCandidates()) {
    let retries = 0
    while (retries <= 8) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
              responseJsonSchema: schema,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 429) {
          const delayMs = parseRetryDelay(errorText)
          console.log(`Rate limited — retrying in ${Math.ceil(delayMs / 1000)}s...`)
          await sleep(delayMs)
          retries++
          continue
        }
        const error = new Error(`Gemini request failed with ${response.status}: ${errorText}`)
        if (response.status === 404) {
          lastError = error
          break
        }
        throw error
      }

      const payload = await response.json()
      const text = extractTextFromGeminiResponse(payload)
      if (!text) throw new Error('Gemini returned an empty response.')
      return parseJsonText(text)
    }
  }

  throw lastError ?? new Error('No supported Gemini model was available.')
}

function normalizeString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Gemini response is missing ${label}.`)
  }
  return value.trim()
}

const BATCH_SIZE = 10

const postBatchSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      titleKo: { type: 'string' },
      contentKo: { type: 'string' },
      titleJa: { type: 'string' },
      contentJa: { type: 'string' },
    },
    required: ['id', 'titleKo', 'contentKo', 'titleJa', 'contentJa'],
  },
}

const commentBatchSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      contentKo: { type: 'string' },
      contentJa: { type: 'string' },
    },
    required: ['id', 'contentKo', 'contentJa'],
  },
}

function buildPostBatchPrompt(posts) {
  return `You are backfilling bilingual community forum content for BridgePass, a Korean-Japanese hiring community.

Translate each post into natural Korean and natural Japanese.

Rules:
- Preserve factual meaning, names, dates, URLs, code identifiers, product names, and markdown structure.
- Do not summarize, add advice, add claims, or moderate the content.
- If the source mixes Korean and Japanese, produce complete, natural versions in both languages.
- Keep a professional community tone, but preserve the author's intent.
- Return a JSON array with one object per post, each containing: id, titleKo, contentKo, titleJa, contentJa.

Posts:
${JSON.stringify(posts.map((p) => ({ id: p.id, title: p.title, content: p.content })), null, 2)}`
}

function buildCommentBatchPrompt(comments) {
  return `You are backfilling bilingual community comments for BridgePass, a Korean-Japanese hiring community.

Translate each comment into natural Korean and natural Japanese.

Rules:
- Preserve factual meaning, names, dates, URLs, code identifiers, emoji, and the author's tone.
- Do not summarize, add advice, add claims, or moderate the content.
- If the source mixes Korean and Japanese, produce complete, natural versions in both languages.
- Return a JSON array with one object per comment, each containing: id, contentKo, contentJa.

Comments:
${JSON.stringify(comments.map((c) => ({ id: c.id, content: c.content })), null, 2)}`
}

function postNeedsBackfill(post, force) {
  return force || !post.title_ko || !post.title_ja || !post.content_ko || !post.content_ja
}

function commentNeedsBackfill(comment, force) {
  return force || !comment.content_ko || !comment.content_ja
}

async function fetchRows(supabase) {
  const [postsResult, commentsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id,title,content,title_ko,title_ja,content_ko,content_ja')
      .order('id', { ascending: true }),
    supabase
      .from('comments')
      .select('id,content,content_ko,content_ja')
      .order('id', { ascending: true }),
  ])

  if (postsResult.error) throw new Error(`Failed to load posts: ${postsResult.error.message}`)
  if (commentsResult.error) throw new Error(`Failed to load comments: ${commentsResult.error.message}`)

  return {
    posts: postsResult.data ?? [],
    comments: commentsResult.data ?? [],
  }
}

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function translateAndSavePosts(apiKey, supabase, posts) {
  let saved = 0
  const batches = chunk(posts, BATCH_SIZE)

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b]
    const ids = batch.map((p) => p.id).join(', ')
    console.log(`Translating posts batch ${b + 1}/${batches.length} (ids: ${ids})`)
    const results = await generateGeminiJson({
      apiKey,
      prompt: buildPostBatchPrompt(batch),
      schema: postBatchSchema,
    })

    if (!Array.isArray(results) || results.length !== batch.length) {
      throw new Error(`Batch ${b + 1}: expected ${batch.length} results, got ${results?.length ?? 0}`)
    }

    for (const result of results) {
      const values = {
        title_ko: normalizeString(result.titleKo, `post ${result.id} titleKo`),
        content_ko: normalizeString(result.contentKo, `post ${result.id} contentKo`),
        title_ja: normalizeString(result.titleJa, `post ${result.id} titleJa`),
        content_ja: normalizeString(result.contentJa, `post ${result.id} contentJa`),
      }
      const { error } = await supabase.from('posts').update(values).eq('id', result.id)
      if (error) throw new Error(`Failed to update post ${result.id}: ${error.message}`)
      console.log(`Saved post ${result.id}`)
      saved++
    }
  }

  return saved
}

async function translateAndSaveComments(apiKey, supabase, comments) {
  let saved = 0
  const batches = chunk(comments, BATCH_SIZE)

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b]
    const ids = batch.map((c) => c.id).join(', ')
    console.log(`Translating comments batch ${b + 1}/${batches.length} (ids: ${ids})`)
    const results = await generateGeminiJson({
      apiKey,
      prompt: buildCommentBatchPrompt(batch),
      schema: commentBatchSchema,
    })

    if (!Array.isArray(results) || results.length !== batch.length) {
      throw new Error(`Batch ${b + 1}: expected ${batch.length} results, got ${results?.length ?? 0}`)
    }

    for (const result of results) {
      const values = {
        content_ko: normalizeString(result.contentKo, `comment ${result.id} contentKo`),
        content_ja: normalizeString(result.contentJa, `comment ${result.id} contentJa`),
      }
      const { error } = await supabase.from('comments').update(values).eq('id', result.id)
      if (error) throw new Error(`Failed to update comment ${result.id}: ${error.message}`)
      console.log(`Saved comment ${result.id}`)
      saved++
    }
  }

  return saved
}


async function main() {
  loadLocalEnv()

  const options = parseArgs()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { posts, comments } = await fetchRows(supabase)
  const pendingPosts = posts.filter((post) => postNeedsBackfill(post, options.force))
  const pendingComments = comments.filter((comment) => commentNeedsBackfill(comment, options.force))
  const limitedPosts = typeof options.limit === 'number' ? pendingPosts.slice(0, options.limit) : pendingPosts
  const limitedComments = typeof options.limit === 'number' ? pendingComments.slice(0, options.limit) : pendingComments

  console.log(
    [
      `Loaded ${posts.length} posts and ${comments.length} comments.`,
      `Pending ${pendingPosts.length} posts and ${pendingComments.length} comments.`,
      options.limit ? `Limit active: ${options.limit} per table.` : null,
      options.force ? 'Force mode: existing translations will be overwritten.' : null,
      options.dryRun ? 'Dry run: no translations or DB writes will be performed.' : null,
    ]
      .filter(Boolean)
      .join('\n')
  )

  if (options.dryRun) return
  if (limitedPosts.length === 0 && limitedComments.length === 0) return

  const apiKey = readGeminiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY or gemini.key is required for translation.')

  const savedPosts = await translateAndSavePosts(apiKey, supabase, limitedPosts)
  const savedComments = await translateAndSaveComments(apiKey, supabase, limitedComments)

  console.log(`Backfill complete. Updated ${savedPosts} posts and ${savedComments} comments.`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('column') || message.includes('schema cache')) {
    console.error(`${message}\nApply supabase/migrations/20260517000013_community_translations.sql before running this script.`)
  } else {
    console.error(message)
  }
  process.exitCode = 1
})
