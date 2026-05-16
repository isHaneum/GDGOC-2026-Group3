import { createClient } from "@supabase/supabase-js";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey
)

export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'
