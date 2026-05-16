import { createClient, hasSupabaseEnv } from '../../../_lib/supabase'
import { upsertCv } from '../../../../server/services/profileService'
import { jsonResponse, jsonError } from '../../_lib/respond'
import { type NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse({ authenticated: false, saved: false })
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonResponse({ authenticated: false, saved: false })
    const { contents } = await request.json()
    if (!Array.isArray(contents)) return jsonError(new Error('contents must be an array'))
    const data = await upsertCv(db, user.id, contents)
    return jsonResponse({ authenticated: true, saved: true, cv: data })
  } catch (error) {
    return jsonError(error)
  }
}
