import { type NextRequest } from 'next/server'
import { supabaseServer, GUEST_USER_ID } from '../../../../../server/services/supabase'
import { createComment } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { content } = await request.json()
    if (!content) return jsonError(new Error('content is required'))
    const data = await createComment(supabaseServer, GUEST_USER_ID, id, { content })
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
