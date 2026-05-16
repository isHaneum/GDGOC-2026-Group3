# Two-sided Fit Dashboard

`TwoSidedFitDashboard` is now a legacy/internal component, not a mounted product route.

The old `/debug/two-sided-fit` page was removed during the route tree cleanup. The current user-facing flows are split into normalized applicant and employer routes:

- Applicant company list: `/employee/companies`
- Applicant company detail: `/employee/companies/[companyId]`
- Employer applicant list: `/employer/applicants`
- Employer applicant detail: `/employer/applicants/[applicantId]/portfolio`

## Purpose

The component remains useful as a reference implementation for:

- developer-to-company ranking
- company-to-developer ranking
- compact score labels
- deterministic matching explanations
- validation/debug display patterns

It should not be reintroduced as a mixed product page without an explicit routing decision.

## Data Files Used

The component and related product pages use company criteria data through `src/lib/companyCriteria.ts` and related helper modules:

- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/companyRubrics.json`
- `public/data/company-criteria/companySignals.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`
- `public/data/company-criteria/fitEngineMetadata.json`

## Engine Functions Called

The deterministic fit engine functions remain:

- `rankCompaniesForDeveloper(...)`
- `rankDevelopersForCompany(...)`
- `validateCompanyJobProfiles(...)`

No scoring engine changes are required for route cleanup.

## Display Rules To Preserve

- Product pages should stay role-specific.
- Applicant routes should focus on companies and portfolio.
- Employer routes should focus on postings and applicants.
- Raw JSON, validation details, source confidence, rubric IDs, and internal metadata should stay hidden from default product UI.
- Use explicit placeholder pages for unfinished routes.

## Safety Note

The fit dashboard and engine are not automated hiring decision systems. Scores are used for discovery, preparation, and human review.
