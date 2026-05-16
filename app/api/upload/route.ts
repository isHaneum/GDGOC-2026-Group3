import { type NextRequest } from 'next/server'
import { requireSupabaseServer } from '../../../server/services/supabase'
import { jsonResponse, jsonError } from '../_lib/respond'

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = requireSupabaseServer()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return jsonError(new Error('file is required'))

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabaseServer.storage
      .from('post-images')
      .upload(filename, file, { contentType: file.type, upsert: false })

    if (error) throw new Error(error.message)

    const { data } = supabaseServer.storage
      .from('post-images')
      .getPublicUrl(filename)

    return jsonResponse({ url: data.publicUrl })
  } catch (error) {
    return jsonError(error)
  }
}
