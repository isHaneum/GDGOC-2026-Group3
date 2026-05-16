import { type NextRequest } from 'next/server'
import { createClient } from '../../../_lib/supabase'
import { signUp } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, market, nickname, companyId } = await request.json()
    if (!email || !password || !role || !market || !nickname) {
      return jsonError(new Error('Missing required fields'))
    }
    if (!['employee', 'employer'].includes(role)) {
      return jsonError(new Error('role must be employee or employer'))
    }
    if (!['KR_TO_JP', 'JP_TO_KR'].includes(market)) {
      return jsonError(new Error('market must be KR_TO_JP or JP_TO_KR'))
    }
    const db = await createClient()
    const data = await signUp(db, { email, password, role, market, nickname, companyId })
    return jsonResponse({ user: data.user })
  } catch (error) {
    return jsonError(error)
  }
}
