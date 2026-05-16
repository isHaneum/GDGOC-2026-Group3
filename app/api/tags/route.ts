import { type NextRequest } from 'next/server'
import { createClient } from '../../_lib/supabase'
import { listTags } from '../../../server/services/forumService'
import { jsonResponse, jsonError } from '../_lib/respond'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const db = await createClient()
    const data = await listTags(db, searchParams.get('q') ?? undefined)
    return jsonResponse({ tags: data })
  } catch (error) {
    return jsonError(error)
  }
}
