import type { SupabaseClient } from '@supabase/supabase-js'

export type SignUpInput = {
  email: string
  password: string
  role: 'developer' | 'employer'
  market: 'KR' | 'JP'
}

export type SignInInput = {
  email: string
  password: string
}

export async function signUp(db: SupabaseClient, input: SignUpInput) {
  const { data, error } = await db.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { role: input.role, market: input.market } },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signIn(db: SupabaseClient, input: SignInInput) {
  const { data, error } = await db.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut(db: SupabaseClient) {
  const { error } = await db.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getMe(db: SupabaseClient) {
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError) throw new Error(profileError.message)
  return { user, profile }
}
