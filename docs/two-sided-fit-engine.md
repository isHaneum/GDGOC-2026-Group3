# Two-sided Fit Engine

## 목적
BridgePass 는 개발자와 회사를 양방향으로 매칭합니다.

## 개발자 측
개발자는 다음 정보를 입력합니다.
- 희망 연봉
- 희망 지역
- 사용 가능한 기술 스택
- 언어 자격 / 수준
- 경력 연차
- 목표 역할
- 선호 근무 방식
- relocation / visa 제약
- 이력서 / 포트폴리오 / 동기

엔진은 다음을 반환합니다.
- 잘 맞는 회사와 역할
- 적합도 점수
- 왜 맞는지 설명
- 어떤 신호가 부족한지
- 지원 전에 어떤 evidence mission 이 필요한지
- 다음 액션 제안

## 기업 측
기업은 다음 정보를 사용합니다.
- 필수 기술
- 선호 기술
- 연봉 범위
- 지역
- 언어 요구사항
- 경력 범위
- 회사별 rubric

엔진은 다음을 반환합니다.
- 우선 검토할 후보
- 세부 score breakdown
- 왜 맞는지 / 무엇이 부족한지
- 무엇을 검증해야 하는지
- recruiter action 추천

## 잡보드와의 차이
잡보드는 공고를 보여줍니다.
BridgePass 는 fit 이유를 설명하고, gap 을 드러내고, 지원 전에 mission 을 추천합니다.

## 안전성
이 기능은 자동 채용 의사결정 시스템이 아닙니다.
추천과 준비 가이드를 제공하는 보조 엔진입니다.

## 추가된 데이터
- `public/data/company-criteria/companyJobProfiles.json`
- `public/data/company-criteria/sampleDeveloperProfiles.json`
- `public/data/company-criteria/fitEngineMetadata.json`

## 추가된 라이브러리
- `src/lib/companyCriteria.ts`
- `src/lib/applicantProfiles.ts`
- `src/lib/twoSidedFitEngine.ts`

## 핵심 함수
- `loadCompanyRubrics()`
- `loadCompanySignals()`
- `loadCompanyJobProfiles()`
- `loadApplicantProfiles()`
- `rankCompaniesForDeveloper()`
- `rankDevelopersForCompany()`
- `getRecommendedEvidenceMissions()`
- `explainDeveloperCompanyFit()`
- `explainCompanyCandidateFit()`
- `validateCompanyJobProfiles()`
- `loadAndRunTwoSidedFitExample()`

## 사용 예시
```ts
import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals
} from "../src/lib/companyCriteria";
import { loadApplicantProfiles } from "../src/lib/applicantProfiles";
import { rankCompaniesForDeveloper } from "../src/lib/twoSidedFitEngine";

const [profiles, rubrics, signals, developers] = await Promise.all([
  loadCompanyJobProfiles(),
  loadCompanyRubrics(),
  loadCompanySignals(),
  loadApplicantProfiles()
]);

const result = rankCompaniesForDeveloper(developers[0], profiles, rubrics, signals);
console.log(result.slice(0, 3));
```

## 품질 개선 계획
향후 `companyJobProfiles.json` 은 다음 우선순위로 개선해야 합니다.

1. 공식 role-specific 채용 페이지
2. 공식 엔지니어링 채용 페이지
3. 역할별 job posting page
4. 허용된 공개 채용 플랫폼
5. 엔지니어링 블로그는 보조 문맥으로만 사용

좋은 URL 패턴 예시:
- `/careers/engineer`
- `/recruit/engineer`
- `/jobs/frontend-engineer`
- `/jobs/software-engineer`
- `/engineering/recruit`
- `/newgrad/engineer`
- `/mid-career/engineer`

약한 URL 패턴 예시:
- `/company`
- `/about`
- 역할 요건이 없는 `/careers`
- 브랜딩 위주인 `/recruit`

## 검증 기준
검증 함수는 다음 warning 을 반환합니다.
- missing salary
- missing location
- missing tech stack
- missing language requirement
- missing experience range
- fallback source
- low source confidence
- no matching rubricId

## 日本語サマリー
BridgePass の Two-sided Fit Engine は、開発者と企業を双方向で比較し、
なぜ合うのか、何が不足しているのか、応募前にどの証拠を追加すべきかを説明します。
これは採用の自動判定ではなく、準備と優先順位付けのためのガイドです。
