import { type NextRequest, NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '../../../_lib/supabase'
import { getMe } from '../../../../server/services/authService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse({ user: null, profile: null, authenticated: false })
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const db = await createClient()
    const { data: { user }, error: authError } = await db.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { nickname } = await request.json() as { nickname?: string }
    if (!nickname?.trim()) return NextResponse.json({ error: 'nickname is required' }, { status: 400 })

    const { error } = await db.from('profiles').update({ nickname: nickname.trim() }).eq('user_id', user.id)
    if (error) throw new Error(error.message)

    return jsonResponse({ saved: true })
  } catch (error) {
    return jsonError(error)
  }
}
