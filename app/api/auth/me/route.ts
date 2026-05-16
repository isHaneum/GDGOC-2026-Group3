import { createClient } from '../../../_lib/supabase'
import { getMe } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function GET() {
  try {
    const db = await createClient()
    const data = await getMe(db)
    return jsonResponse(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return jsonResponse({ user: null, profile: null, authenticated: false })
    }

    return jsonError(error)
  }
}
