import { describe, it, expect, vi } from 'vitest'
import {
  getDeveloperProfile,
  updateDeveloperProfile,
  upsertCv,
} from '../../server/services/profileService'
import type { CvContent } from '../../shared/types'

const PROFILE = { id: 'profile-1', user_id: 'user-1', role: 'developer', market: 'KR' }
const DEV_PROFILE = { id: 'dev-1', profile_id: 'profile-1', full_name: 'Test Dev', tech_stack: [] }
const CV = { id: 'cv-1', developer_profile_id: 'dev-1', contents: [] }

function makeDb(options: { cv?: unknown } = {}) {
  let callIndex = 0
  const results = [
    { data: PROFILE, error: null },
    { data: DEV_PROFILE, error: null },
    { data: 'cv' in options ? options.cv : CV, error: null },
  ]

  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(results[callIndex++] ?? { data: null, error: null })),
  }

  return { from: vi.fn().mockReturnValue(builder), _builder: builder }
}

describe('getDeveloperProfile', () => {
  it('returns profile, devProfile, and cv', async () => {
    const db = makeDb()
    const result = await getDeveloperProfile(db as any, 'user-1')
    expect(result.profile.id).toBe('profile-1')
    expect(result.devProfile.id).toBe('dev-1')
    expect(result.cv?.id).toBe('cv-1')
  })

  it('returns null cv when none exists', async () => {
    const db = makeDb({ cv: null })
    const result = await getDeveloperProfile(db as any, 'user-1')
    expect(result.cv).toBeNull()
  })
})

describe('updateDeveloperProfile', () => {
  it('updates and returns developer profile', async () => {
    let callIndex = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...DEV_PROFILE, full_name: 'Updated' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[callIndex++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const result = await updateDeveloperProfile(db as any, 'user-1', { full_name: 'Updated' })
    expect(result.full_name).toBe('Updated')
  })
})

describe('upsertCv', () => {
  it('inserts cv when none exists', async () => {
    let callIndex = 0
    const results = [
      { data: PROFILE, error: null },
      { data: DEV_PROFILE, error: null },
      { data: null, error: null },
      { data: { ...CV, contents: [{ name: 'Skills', content: 'React' }] }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[callIndex++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const contents: CvContent[] = [{ name: 'Skills', content: 'React' }]
    const result = await upsertCv(db as any, 'user-1', contents)
    expect(result.contents).toEqual([{ name: 'Skills', content: 'React' }])
  })
})
