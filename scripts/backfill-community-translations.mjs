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
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1))
    throw new Error('Gemini did not return parseable JSON.')
  }
}

async function generateGeminiJson({ apiKey, prompt, schema, temperature = 0.1 }) {
  let lastError = null

  for (const model of getGeminiModelCandidates()) {
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
      const error = new Error(`Gemini request failed with ${response.status}: ${errorText}`)
      if (response.status === 404) {
        lastError = error
        continue
      }
      throw error
    }

    const payload = await response.json()
    const text = extractTextFromGeminiResponse(payload)
    if (!text) throw new Error('Gemini returned an empty response.')
    return parseJsonText(text)
  }

  throw lastError ?? new Error('No supported Gemini model was available.')
}

function normalizeString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Gemini response is missing ${label}.`)
  }
  return value.trim()
}

const postTranslationSchema = {
  type: 'object',
  properties: {
    titleKo: { type: 'string' },
    contentKo: { type: 'string' },
    titleJa: { type: 'string' },
    contentJa: { type: 'string' },
  },
  required: ['titleKo', 'contentKo', 'titleJa', 'contentJa'],
}

const commentTranslationSchema = {
  type: 'object',
  properties: {
    contentKo: { type: 'string' },
    contentJa: { type: 'string' },
  },
  required: ['contentKo', 'contentJa'],
}

function buildPostPrompt(post) {
  return `You are backfilling bilingual community forum content for BridgePass, a Korean-Japanese hiring community.

Translate the current post into natural Korean and natural Japanese.

Rules:
- Preserve factual meaning, names, dates, URLs, code identifiers, product names, and markdown structure.
- Do not summarize, add advice, add claims, or moderate the content.
- If the source mixes Korean and Japanese, produce complete, natural versions in both languages.
- Keep a professional community tone, but preserve the author's intent.
- Return JSON only.

Post:
${JSON.stringify({ id: post.id, title: post.title, content: post.content }, null, 2)}`
}

function buildCommentPrompt(comment) {
  return `You are backfilling bilingual community comments for BridgePass, a Korean-Japanese hiring community.

Translate the current comment into natural Korean and natural Japanese.

Rules:
- Preserve factual meaning, names, dates, URLs, code identifiers, emoji, and the author's tone.
- Do not summarize, add advice, add claims, or moderate the content.
- If the source mixes Korean and Japanese, produce complete, natural versions in both languages.
- Return JSON only.

Comment:
${JSON.stringify({ id: comment.id, content: comment.content }, null, 2)}`
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

async function translatePosts(apiKey, posts) {
  const updates = []

  for (const post of posts) {
    console.log(`Translating post ${post.id}`)
    const result = await generateGeminiJson({
      apiKey,
      prompt: buildPostPrompt(post),
      schema: postTranslationSchema,
    })

    updates.push({
      id: post.id,
      title_ko: normalizeString(result.titleKo, `post ${post.id} titleKo`),
      content_ko: normalizeString(result.contentKo, `post ${post.id} contentKo`),
      title_ja: normalizeString(result.titleJa, `post ${post.id} titleJa`),
      content_ja: normalizeString(result.contentJa, `post ${post.id} contentJa`),
    })
  }

  return updates
}

async function translateComments(apiKey, comments) {
  const updates = []

  for (const comment of comments) {
    console.log(`Translating comment ${comment.id}`)
    const result = await generateGeminiJson({
      apiKey,
      prompt: buildCommentPrompt(comment),
      schema: commentTranslationSchema,
    })

    updates.push({
      id: comment.id,
      content_ko: normalizeString(result.contentKo, `comment ${comment.id} contentKo`),
      content_ja: normalizeString(result.contentJa, `comment ${comment.id} contentJa`),
    })
  }

  return updates
}

async function applyUpdates(supabase, table, updates) {
  for (const update of updates) {
    const { id, ...values } = update
    const { error } = await supabase.from(table).update(values).eq('id', id)
    if (error) throw new Error(`Failed to update ${table} ${id}: ${error.message}`)
    console.log(`Updated ${table} ${id}`)
  }
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

  const postUpdates = await translatePosts(apiKey, limitedPosts)
  const commentUpdates = await translateComments(apiKey, limitedComments)

  await applyUpdates(supabase, 'posts', postUpdates)
  await applyUpdates(supabase, 'comments', commentUpdates)

  console.log(`Backfill complete. Updated ${postUpdates.length} posts and ${commentUpdates.length} comments.`)
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
