import { type NextRequest } from 'next/server'
import { supabaseServer } from '../../../../../server/services/supabase'
import { createComment } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'

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
