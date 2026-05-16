import { createClient } from '../../../_lib/supabase'
import { getDeveloperProfile, updateDeveloperProfile } from '../../../../server/services/profileService'
import { jsonResponse, jsonError } from '../../_lib/respond'
import { type NextRequest } from 'next/server'

export async function GET() {
  try {
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    const data = await getDeveloperProfile(db, user.id)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    const updates = await request.json()
    const data = await updateDeveloperProfile(db, user.id, updates)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
