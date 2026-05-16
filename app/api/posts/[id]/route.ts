import { type NextRequest } from 'next/server'
import { createClient } from '../../../_lib/supabase'
import { getPost, updatePost, deletePost } from '../../../../server/services/forumService'
import { jsonResponse, jsonError } from '../../_lib/respond'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await createClient()
    const data = await getPost(db, id)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    const body = await request.json()
    const data = await updatePost(db, user.id, id, body)
    return jsonResponse(data)
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) return jsonError(new Error('Not authenticated'))
    await deletePost(db, user.id, id)
    return jsonResponse({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
