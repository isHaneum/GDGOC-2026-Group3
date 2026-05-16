import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbDeveloperProfile, CvContent } from '../../shared/types'

export async function getDeveloperProfile(db: SupabaseClient, userId: string) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data: devProfile, error: e2 } = await db
    .from('developer_profiles')
    .select('*')
    .eq('profile_id', profile.id)
    .single()
  if (e2) throw new Error(e2.message)

  const { data: cv } = await db
    .from('cvs')
    .select('*')
    .eq('developer_profile_id', devProfile.id)
    .single()

  return { profile, devProfile, cv: cv ?? null }
}

export async function updateDeveloperProfile(
  db: SupabaseClient,
  userId: string,
  updates: Partial<Omit<DbDeveloperProfile, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data, error } = await db
    .from('developer_profiles')
    .update(updates)
    .eq('profile_id', profile.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertCv(
  db: SupabaseClient,
  userId: string,
  contents: CvContent[]
) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data: devProfile, error: e2 } = await db
    .from('developer_profiles')
    .select('id')
    .eq('profile_id', profile.id)
    .single()
  if (e2) throw new Error(e2.message)

  const { data: existing } = await db
    .from('cvs')
    .select('id')
    .eq('developer_profile_id', devProfile.id)
    .single()

  if (existing) {
    const { data, error } = await db
      .from('cvs')
      .update({ contents })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await db
    .from('cvs')
    .insert({ developer_profile_id: devProfile.id, contents })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
