import { type NextRequest } from 'next/server'
import { createClient, hasSupabaseEnv } from '../../../_lib/supabase'
import { getEmployeeProfile, upsertEmployeeProfile } from '../../../../server/services/profileService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse({ authenticated: false, profile: null, employeeProfile: null })
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonResponse({ authenticated: false, profile: null, employeeProfile: null })

    const data = await getEmployeeProfile(db, user.id)
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
    const employeeProfile = await upsertEmployeeProfile(db, user.id, updates)
    return jsonResponse({ authenticated: true, saved: true, employeeProfile })
  } catch (error) {
    return jsonError(error)
  }
}
