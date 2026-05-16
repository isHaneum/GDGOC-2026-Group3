import { describe, expect, it } from 'vitest'
import { MARKETS } from '../../shared/market'
import type { ResumeContextMappingRequest } from '../../shared/types'
import {
  buildResumeContextFields,
  normalizeGeminiResumeContextResult,
  validateResumeContextMappingRequest,
} from '../../server/services/resumeContextMapper'
import { buildResumeContextRequest } from '../../src/lib/marketAdapter'
import type { DeveloperPreference } from '../../shared/companyCriteriaTypes'

const validRequest: ResumeContextMappingRequest = {
  targetLocale: 'ja',
  sourceLocaleHint: 'ko',
  applicant: {
    applicantId: 'db-1',
    employeeProfileId: 1,
    name: '김민서',
    nationality: 'Korean',
    yearsOfExperience: 2,
    targetRoles: ['Frontend Engineer'],
  },
  portfolio: {
    techStack: ['React', 'TypeScript'],
    languageCertifications: ['Japanese JLPT N2'],
    preferredSalary: '5,000,000-7,000,000 JPY',
    preferredLocations: ['Tokyo'],
    preferredCompanyTypes: ['SaaS'],
    workStylePreference: 'hybrid',
    relocationAvailable: true,
    visaSupportNeeded: true,
    selfIntroduction: 'React 기반 서비스 개선 경험이 있습니다.',
    keyProjectExperience: 'Next.js 프로젝트에서 성능 개선을 담당했습니다.',
    motivation: '일본 제품 팀에서 성장하고 싶습니다.',
    concerns: ['비즈니스 일본어 보고 경험'],
    githubUrl: 'https://github.com/example',
  },
}

describe('validateResumeContextMappingRequest', () => {
  it('accepts a portfolio-shaped request', () => {
    const result = validateResumeContextMappingRequest(validRequest)
    expect(result.ok).toBe(true)
  })

  it('rejects the old contents-only request shape', () => {
    const result = validateResumeContextMappingRequest({
      targetLocale: 'ja',
      contents: [{ name: 'Name', content: '김민서' }],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('sourceLocaleHint')
  })

  it('rejects an invalid locale', () => {
    const result = validateResumeContextMappingRequest({ ...validRequest, targetLocale: 'en' })
    expect(result.ok).toBe(false)
  })

  it('rejects oversized portfolio content', () => {
    const result = validateResumeContextMappingRequest({
      ...validRequest,
      portfolio: {
        ...validRequest.portfolio,
        selfIntroduction: 'x'.repeat(4001),
      },
    })

    expect(result.ok).toBe(false)
  })
})

describe('normalizeGeminiResumeContextResult', () => {
  it('rejects malformed Gemini-shaped output', () => {
    expect(() =>
      normalizeGeminiResumeContextResult(
        {
          detectedSourceLocale: 'ko',
          items: buildResumeContextFields(validRequest).map(() => ({
            mappedLabel: '項目',
            mappedValue: '内容',
            detectedSourceLocale: 'ko',
            contextNotes: [{ note: '根拠あり', confidence: 'high' }],
          })),
        },
        validRequest,
        'result-1',
        '2026-05-17T00:00:00.000Z'
      )
    ).toThrow(/fieldKey/)
  })
})

describe('buildResumeContextRequest', () => {
  it('excludes sensitive birth date and gender fields from AI input', () => {
    const applicant = {
      developerId: 'db-1',
      employeeProfileId: 1,
      name: '김민서',
      nationality: 'Korean',
      preferredSalaryMin: 5000000,
      preferredSalaryMax: 7000000,
      preferredCurrency: 'JPY',
      preferredLocations: ['Tokyo'],
      availableTechStacks: ['React'],
      languageCertifications: [{ language: 'Japanese', level: 'business', certification: 'JLPT N2' }],
      yearsOfExperience: 2,
      targetRoles: ['Frontend Engineer'],
      preferredCompanyTypes: ['SaaS'],
      workStylePreference: 'hybrid',
      relocationAvailable: true,
      visaSupportNeeded: true,
      resumeText: 'React 개발 경험',
      portfolioText: 'Next.js 프로젝트',
      motivation: '일본 제품 팀 지원',
      concerns: ['보고 경험 부족'],
      githubUrl: 'https://github.com/example',
      birthDate: '2000-01-01',
      gender: 'female',
    } as DeveloperPreference & { birthDate: string; gender: string }

    const request = buildResumeContextRequest(applicant, MARKETS['kr-jp'])
    const serialized = JSON.stringify(request)

    expect(serialized).not.toContain('birthDate')
    expect(serialized).not.toContain('gender')
    expect(request.targetLocale).toBe('ja')
  })
})
