import { createClient } from '../../../_lib/supabase'
import { getMe } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function GET() {
  try {
    const db = await createClient()
    const data = await getMe(db)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}
