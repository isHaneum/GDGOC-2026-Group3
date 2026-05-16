# Bridge IT Role Routing Guardrails

## Current Route Tree

- `/` redirects to `/signin`.
- `/signin` is the main sign-in page and public entry point.
- `/signup` redirects to `/signup/onboarding`.
- `/signup/onboarding` lets the user choose applicant or employer.
- `/signup/profile` collects shared account profile fields.
- `/signup/portfolio` is applicant-only.
- `/signup/company` is a placeholder page.
- `/account` is for signed-in account profile review/edit.
- `/community` redirects to `/community/posts`.
- `/community/posts` and `/community/posts/[postId]` are public community pages.
- `/employee` redirects to `/employee/companies`.
- `/employee/companies`, `/employee/companies/[companyId]`, and `/employee/portfolio` are applicant-only.
- `/employee/applications` is a placeholder page.
- `/employer` redirects to `/employer/postings`.
- `/employer/applicants` and `/employer/applicants/[applicantId]/portfolio` are employer-only.
- `/employer/company`, `/employer/postings`, and `/employer/postings/[postingId]` are placeholder pages.
- `/not-found` is the visible 404 page.
- Unknown routes redirect to `/signin`.

## Removed Product Routes

The old product/debug entry routes are no longer user-facing pages:

- `/developer`
- `/developer/coach`
- `/developer/register`
- `/apply`
- `/companies`
- `/forums`
- `/get-started`
- `/onboarding`
- `/signal-lab`
- `/debug/*`

If an old link must remain temporarily compatible, handle it in `proxy.ts` as a redirect rather than restoring the page.

## Public State

Before role selection or login:

- Show the Bridge IT logo.
- Show only public sign-in/sign-up/community access.
- Do not show applicant or employer workflow tabs unless a role is known.
- Do not show the old market direction toggle in the top nav.

## Applicant Role

Allowed applicant nav:

- 채용중인 회사 (`/employee/companies`)
- 내 포트폴리오 (`/employee/portfolio`)
- 커뮤니티 (`/community/posts`)
- 계정 (`/account`)

Applicant-only route gate:

- `/employee/*`
- `/signup/portfolio`

Applicant pages must not expose:

- 지원자 관리 as a primary workflow
- employer candidate ranking panels
- company/job condition editing

## Employer Role

Allowed employer nav:

- 채용 공고 (`/employer/postings`)
- 지원자 (`/employer/applicants`)
- 커뮤니티 (`/community/posts`)
- 계정 (`/account`)

Employer-only route gate:

- `/employer/*`

Employer pages must not expose:

- applicant portfolio editing as a primary workflow
- applicant-side company recommendation pages as the main view

## Auth And Redirect Safety

- `/api/auth/me` returns an unauthenticated payload instead of throwing a browser-visible 500 for signed-out users.
- `proxy.ts` owns hard redirects for root, section index routes, legacy routes, and unknown routes.
- Missing Supabase env must degrade without crashing local route rendering.
- Never commit API keys or local secret files.

## Layout Guardrails

- Page-level wrappers should be fluid by default.
- Avoid `container mx-auto`, page-level `max-w-7xl`, or fixed viewport padding that makes the whole page look locked to one ratio.
- Keep max-width constraints on inner forms, dialogs, and repeated cards only when the constraint improves readability.
- The global nav must not render the old KR/JP market toggle.

## Change Control

When modifying routing:

- Update `proxy.ts` if a public redirect changes.
- Update `src/lib/roleStorage.ts` if role-gated paths change.
- Update `src/components/RoleAwareNav.tsx` if role nav changes.
- Run `npm run check:role-routing`.
- Run `npm run typecheck`.
- Run `npm run build` for route tree changes.
