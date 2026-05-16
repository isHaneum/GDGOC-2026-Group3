# Signal Lab

Signal Lab was the standalone validation surface for comparing sample developer profiles with company job profiles and rubrics.

The public `/signal-lab` page is currently retired. The normalized product routes are:

- Applicant company discovery: `/employee/companies`
- Applicant company detail: `/employee/companies/[companyId]`
- Employer applicant list: `/employer/applicants`
- Employer applicant detail: `/employer/applicants/[applicantId]/portfolio`

`/signal-lab` is redirected to `/signin` by `proxy.ts`.

## Current Use

The underlying deterministic matching logic remains available in code and data modules:

- `src/lib/twoSidedFitEngine.ts`
- `src/lib/companyCriteria.ts`
- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/companyRubrics.json`
- `public/data/company-criteria/companySignals.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`

Use those modules inside the applicant and employer product routes instead of restoring a separate Signal Lab page.

## Data Rules

- Company job profile data should be loaded from Supabase-backed loaders where available.
- Static JSON in `public/data/company-criteria/` may still be used for sample developer profiles and local verification fixtures.
- Do not silently fall back to mock AI output in labeled AI result areas.
- Missing salary, location, language, or source fields should be shown as confirmation-needed states instead of invented data.

## Safety Notes

Signal rankings are deterministic exploration signals. They must not be presented as automated hiring decisions, compensation decisions, or eligibility screening.
