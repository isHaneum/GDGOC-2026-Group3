import { createClient } from '../../_lib/supabase'
import { listCategories } from '../../../server/services/forumService'
import { jsonResponse, jsonError } from '../_lib/respond'

export async function GET() {
  try {
    const db = await createClient()
    const data = await listCategories(db)
    return jsonResponse({ categories: data })
  } catch (error) {
    return jsonError(error)
  }
}
