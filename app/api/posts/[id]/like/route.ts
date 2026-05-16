import { type NextRequest } from 'next/server'
import { supabaseServer } from '../../../../../server/services/supabase'
import { toggleLike } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await toggleLike(supabaseServer, GUEST_USER_ID, id)
    return jsonResponse(result)
  } catch (error) {
    return jsonError(error)
  }
}
