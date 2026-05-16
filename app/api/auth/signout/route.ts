import { createClient } from '../../../_lib/supabase'
import { signOut } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function POST() {
  try {
    const db = await createClient()
    await signOut(db)
    return jsonResponse({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
