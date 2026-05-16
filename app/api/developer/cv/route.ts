import { createClient } from '../../../_lib/supabase'
import { upsertCv } from '../../../../server/services/profileService'
import { jsonResponse, jsonError } from '../../_lib/respond'
import { type NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    const { contents } = await request.json()
    if (!Array.isArray(contents)) return jsonError(new Error('contents must be an array'))
    const data = await upsertCv(db, user.id, contents)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
