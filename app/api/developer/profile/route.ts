import { createClient, hasSupabaseEnv } from '../../../_lib/supabase'
import { getDeveloperProfile, updateDeveloperProfile } from '../../../../server/services/profileService'
import { jsonResponse, jsonError } from '../../_lib/respond'
import { type NextRequest } from 'next/server'

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse({ authenticated: false, profile: null, devProfile: null, cv: null })
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonResponse({ authenticated: false, profile: null, devProfile: null, cv: null })
    const data = await getDeveloperProfile(db, user.id)
    return jsonResponse({ authenticated: true, ...data })
  } catch (error) {
    return jsonError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse({ authenticated: false, saved: false })
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonResponse({ authenticated: false, saved: false })
    const updates = await request.json()
    const data = await updateDeveloperProfile(db, user.id, updates)
    return jsonResponse({ authenticated: true, saved: true, devProfile: data })
  } catch (error) {
    return jsonError(error)
  }
}
