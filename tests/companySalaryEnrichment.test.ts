import companyJobProfiles from '../public/data/company-criteria/companyJobProfiles.json'
import companyRubrics from '../public/data/company-criteria/companyRubrics.json'
import salaryDataset from '../docs/japan_it_companies_salary_enriched.json'
import type { CompanyEvaluationRubric, CompanyJobProfile } from '../shared/companyCriteriaTypes'
import { validateCompanyJobProfiles } from '../src/lib/twoSidedFitEngine'
import { getSalaryEnrichmentCompanyCount, mergeCompanySalaryDataList } from '../src/lib/companySalaryEnrichment'
import { describe, expect, it } from 'vitest'

describe('company salary enrichment', () => {
  it('keeps salary dataset metadata aligned with company entries', () => {
    expect(salaryDataset.metadata.companyCount).toBe(salaryDataset.companies.length)
    expect(getSalaryEnrichmentCompanyCount()).toBe(salaryDataset.companies.length)
    expect(new Set(salaryDataset.companies.map((company) => company.companyId)).size).toBe(salaryDataset.companies.length)
  })

  it('merges salary data into every company profile company id', () => {
    const merged = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[])

    expect(new Set(merged.map((profile) => profile.companyId)).size).toBe(salaryDataset.companies.length)
    expect(merged.every((profile) => (profile.salarySourceLinks?.length ?? 0) > 0)).toBe(true)
  })

  it('removes missing salary warnings after enrichment', () => {
    const merged = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[])
    const summary = validateCompanyJobProfiles(merged, companyRubrics as CompanyEvaluationRubric[])

    expect(summary.commonWarnings.find((warning) => warning.warning === 'missing salary')).toBeUndefined()
  })
})