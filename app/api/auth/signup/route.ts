import { type NextRequest } from 'next/server'
import { createClient } from '../../../_lib/supabase'
import { signUp } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, market } = await request.json()
    if (!email || !password || !role || !market) {
      return jsonError(new Error('Missing required fields'))
    }
    if (!['developer', 'employer'].includes(role)) {
      return jsonError(new Error('role must be developer or employer'))
    }
    if (!['KR', 'JP'].includes(market)) {
      return jsonError(new Error('market must be KR or JP'))
    }
    const db = await createClient()
    const data = await signUp(db, { email, password, role, market })
    return jsonResponse({ user: data.user })
  } catch (error) {
    return jsonError(error)
  }
}
