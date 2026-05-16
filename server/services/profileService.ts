import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbEmployeeProfile, CvContent } from '../../shared/types'

export type EmployeeProfileUpsert = Omit<
  DbEmployeeProfile,
  'id' | 'profile_id' | 'created_at' | 'updated_at'
>

export async function getEmployeeProfile(db: SupabaseClient, userId: string) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data: employeeProfile, error: e2 } = await db
    .from('employee_profiles')
    .select('*')
    .eq('profile_id', profile.id)
    .single()
  if (e2) throw new Error(e2.message)

  return { profile, employeeProfile }
}

export async function upsertEmployeeProfile(
  db: SupabaseClient,
  userId: string,
  updates: EmployeeProfileUpsert
) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data, error } = await db
    .from('employee_profiles')
    .upsert({ ...updates, profile_id: profile.id }, { onConflict: 'profile_id' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getDeveloperProfile(db: SupabaseClient, userId: string) {
  const { profile, employeeProfile } = await getEmployeeProfile(db, userId)
  return { profile, devProfile: employeeProfile, cv: null }
}

export async function updateDeveloperProfile(
  db: SupabaseClient,
  userId: string,
  updates: EmployeeProfileUpsert
) {
  return upsertEmployeeProfile(db, userId, updates)
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
