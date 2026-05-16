import { type NextRequest } from 'next/server'
import { supabaseServer, GUEST_USER_ID } from '../../../../../server/services/supabase'
import { toggleLike } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await toggleLike(supabaseServer, GUEST_USER_ID, id)
    return jsonResponse(result)
  } catch (error) {
    return jsonError(error)
  }
}
