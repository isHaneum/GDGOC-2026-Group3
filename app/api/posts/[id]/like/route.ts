import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../_lib/supabase'
import { toggleLike } from '../../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../../_lib/respond'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await createClient()
    const { data: { user }, error: authError } = await db.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const result = await toggleLike(db, user.id, id)
    return jsonResponse(result)
  } catch (error) {
    return jsonError(error)
  }
}
