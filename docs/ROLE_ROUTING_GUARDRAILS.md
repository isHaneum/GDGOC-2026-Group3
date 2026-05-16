# Bridge IT Role Routing Guardrails

## Public state
Before role selection/login:
- No full top nav
- Only Bridge IT logo and role entry
- No Applicants tab
- No developer/employer mixed pages

## Developer role
Allowed developer nav:
- 기업별 구인정보
- 추천 직무
- 자기소개서

Developer must not see:
- 지원자 관리
- 기업용 후보자 랭킹
- 기업 직무 조건 편집

## Employer role
Allowed employer nav:
- 추천 개발자
- 지원자 관리
- 기업/직무 조건

Employer must not see:
- 자기소개서 작성
- 개발자용 기업 추천 리스트 as their main view

## Signal Lab
- Must be role-aware
- Developer mode shows only company/role recommendation
- Employer mode shows only candidate recommendation
- No mixed two-sided dashboard by default

## Auth/env safety
- App must run without Supabase env in local demo mode
- Missing env should degrade gracefully
- Never commit API keys

## Change control
When modifying routing:
- touch only route/nav files needed
- run typecheck
- run build if feasible
- do not broad-format unrelated files
