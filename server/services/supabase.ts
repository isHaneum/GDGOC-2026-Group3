import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseServer = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null

export function requireSupabaseServer() {
  if (!supabaseServer) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return supabaseServer
}

export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'
