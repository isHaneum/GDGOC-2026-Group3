import { type NextRequest } from 'next/server'
import { createClient } from '../../../../_lib/supabase'
import { createComment } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    const { content } = await request.json()
    if (!content) return jsonError(new Error('content is required'))
    const data = await createComment(db, user.id, id, { content })
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
