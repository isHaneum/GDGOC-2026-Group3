import { describe, it, expect, vi } from 'vitest'
import {
  getEmployeeProfile,
  upsertEmployeeProfile,
} from '../../server/services/profileService'

const PROFILE = { id: 'profile-1', user_id: 'user-1', role: 'employee', market: 'KR_TO_JP' }
const EMPLOYEE_PROFILE = {
  id: 'employee-1',
  profile_id: 'profile-1',
  full_name: '김민서',
  birth_date: '2000-01-01',
  gender: 'female',
  nationality: 'korean',
  years_of_experience: 2,
  target_roles: ['Frontend Engineer'],
  tech_stack: ['React'],
  language_certifications: 'Japanese JLPT N2',
  preferred_salary_min: 5000000,
  preferred_salary_max: 7000000,
  preferred_currency: 'JPY',
  preferred_locations: ['Tokyo'],
  preferred_company_types: ['SaaS'],
  work_style_preference: 'hybrid',
  relocation_available: true,
  visa_support_needed: true,
  self_introduction: '안녕하세요.',
  key_project_experience: 'Next.js 프로젝트',
  motivation: '일본 제품 팀에서 성장하고 싶습니다.',
  concerns: '비즈니스 일본어 보고 경험',
  github_url: 'https://github.com/example',
}

function makeDb() {
  let callIndex = 0
  const results = [
    { data: PROFILE, error: null },
    { data: EMPLOYEE_PROFILE, error: null },
  ]

  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(results[callIndex++] ?? { data: null, error: null })),
  }

  return { from: vi.fn().mockReturnValue(builder), _builder: builder }
}

describe('getEmployeeProfile', () => {
  it('returns profile and employeeProfile', async () => {
    const db = makeDb()
    const result = await getEmployeeProfile(db as any, 'user-1')
    expect(result.profile.id).toBe('profile-1')
    expect(result.employeeProfile.id).toBe('employee-1')
  })
})

describe('upsertEmployeeProfile', () => {
  it('upserts and returns employee profile', async () => {
    let callIndex = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...EMPLOYEE_PROFILE, full_name: 'Updated' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[callIndex++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const result = await upsertEmployeeProfile(db as any, 'user-1', { ...EMPLOYEE_PROFILE, full_name: 'Updated' })
    expect(result.full_name).toBe('Updated')
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ profile_id: 'profile-1', full_name: 'Updated' }),
      { onConflict: 'profile_id' }
    )
  })
})
