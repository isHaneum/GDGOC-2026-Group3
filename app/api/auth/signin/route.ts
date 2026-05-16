import { type NextRequest } from 'next/server'
import { createClient } from '../../../_lib/supabase'
import { signIn } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return jsonError(new Error('Missing email or password'))
    }
    const db = await createClient()
    const data = await signIn(db, { email, password })
    return jsonResponse({ user: data.user, session: data.session })
  } catch (error) {
    return jsonError(error)
  }
}
