import { type NextRequest } from 'next/server'
import { createClient } from '../../_lib/supabase'
import { supabaseServer } from '../../../server/services/supabase'
import { listPosts, createPost } from '../../../server/services/forumService'
import { jsonResponse, jsonError } from '../_lib/respond'

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const db = await createClient()
    const data = await listPosts(db, {
      category: searchParams.get('category') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.has('offset') ? Number(searchParams.get('offset')) : 0,
    })
    return jsonResponse({ posts: data })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.title || !body.content || !body.category_id) {
      return jsonError(new Error('title, content, and category_id are required'))
    }
    const data = await createPost(supabaseServer, GUEST_USER_ID, body)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
