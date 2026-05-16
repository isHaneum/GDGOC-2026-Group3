'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadFitEngineMetadata,
  loadSampleDeveloperProfiles
} from '../../src/lib/companyCriteria';
import {
  deriveKeySignals,
  formatCompanySalarySummary,
  formatCompanyLogo,
  formatExperienceRange,
  formatHiringPeriodSummary,
  formatJobPostingStatus,
  formatLanguageSummary,
  formatLocationSummary,
  formatQualificationSummary,
  formatRoleTitle,
  formatSalaryRange,
  formatSourceConfidence,
  getDeveloperNextStepKey,
  getFitLabel,
  getFitTone,
  getJobPostingUrl,
  getMissingDataLabel,
  getRecruiterActionKey
} from '../../src/lib/fitDisplayHelpers';
import {
  rankCompaniesForDeveloper,
  rankDevelopersForCompany,
  validateCompanyJobProfiles
} from '../../src/lib/twoSidedFitEngine';
import type {
  CompanyJobProfile,
  CompanyJobProfilesValidationSummary,
  CompanyToDeveloperFitResult,
  CompanyToDeveloperScoreBreakdown,
  DeveloperPreference,
  DeveloperToCompanyFitResult,
  DeveloperToCompanyScoreBreakdown,
  FitEngineMetadata
} from '../../shared/companyCriteriaTypes';

type Locale = 'ko' | 'ja' | 'en';
type Mode = 'developer' | 'employer';
type LoadState = 'loading' | 'ready' | 'error';

type CopyKey = keyof typeof copy.ko;

type PageData = {
  companyJobProfiles: CompanyJobProfile[];
  developerProfiles: DeveloperPreference[];
  metadata: FitEngineMetadata | null;
  validationSummary: CompanyJobProfilesValidationSummary;
  companyRubrics: Awaited<ReturnType<typeof loadCompanyRubrics>>;
  companySignals: Awaited<ReturnType<typeof loadCompanySignals>>;
};

type DraftProfile = {
  resumeText: string;
  motivation: string;
  concernsText: string;
};

type CompanyJobProfileDisplay = CompanyJobProfile & {
  missingFields?: string[];
};

function asDisplayProfile(profile: CompanyJobProfile): CompanyJobProfileDisplay {
  return profile as CompanyJobProfileDisplay;
}

const copy = {
  ko: {
    pageTitle: 'Bridge IT Signal Lab',
    subtitle: '이력서와 기업 기준을 비교해 맞는 회사와 후보자를 찾습니다.',
    recommendationEngine: '추천 엔진',
    roleSelectionTitle: '추천 엔진 역할 선택',
    roleSelectionSubtitle: '개발자 추천과 기업 추천을 분리해서 확인합니다.',
    developerRoleTitle: '개발자',
    developerRoleBody: '이력서와 선호 조건에 맞는 기업과 직무를 찾습니다.',
    employerRoleTitle: 'Hiring Company',
    employerRoleBody: '기업 직무 기준에 맞는 후보자를 찾습니다.',
    chooseRole: '선택하기',
    developerMode: '개발자 추천',
    employerMode: '기업 추천',
    profileTitle: '내 이력서 / 프로필',
    companyResultsTitle: '나에게 맞는 기업과 직무',
    companyCriteriaTitle: '기업 직무 기준',
    candidateResultsTitle: '이 직무에 맞는 지원자',
    selectDeveloper: '샘플 개발자 선택',
    selectRole: '기업 + 직무 선택',
    name: '이름',
    nationality: '국적',
    targetRoles: '목표 직무',
    techStacks: '기술 스택',
    languageCertifications: '언어 자격',
    yearsOfExperience: '경력',
    preferredLocations: '희망 지역',
    preferredSalary: '희망 연봉',
    workStyle: '근무 방식',
    resumeSummary: '이력서 요약',
    motivation: '동기',
    concerns: '우려 사항',
    location: '지역',
    salary: '연봉',
    hiringPeriod: '구인 기간',
    jobPostingStatus: '공고 상태',
    language: '언어',
    qualificationSummary: '자격 요건',
    requiredTechStacks: '필수 기술',
    preferredTechStacks: '우대 기술',
    requiredLanguages: '필수 언어',
    experienceRange: '경력 범위',
    whatMatches: '맞는 점',
    whatMissing: '더 필요한 것',
    nextStep: '다음 단계',
    viewDetails: '상세 보기',
    scoreDetails: '점수 상세',
    keySignals: '핵심 신호',
    strengths: '강점',
    missingEvidence: '부족한 증거',
    recommendedAction: '추천 액션',
    confirmationNeeded: '확인 필요',
    salaryConfirmationNeeded: '연봉 확인 필요',
    hiringPeriodConfirmationNeeded: '구인 기간 확인 필요',
    locationConfirmationNeeded: '위치 확인 필요',
    languageRequirementConfirmationNeeded: '언어 조건 확인 필요',
    qualificationConfirmationNeeded: '자격 요건 확인 필요',
    jobPostingStatusConfirmationNeeded: '공고 상태 확인 필요',
    sourceConfidence: '소스 신뢰도',
    missingData: '검증 필요 데이터',
    missingLogo: '로고',
    missingSalary: '연봉',
    missingLocation: '지역',
    missingLanguageRequirement: '언어 조건',
    missingExperienceRange: '경력 범위',
    missingRequiredTechStacks: '필수 기술',
    missingPreferredTechStacks: '우대 기술',
    missingWorkStyle: '근무 방식',
    missingRoleSpecificSource: '직무별 소스',
    missingOfficialSourceUrl: '공식 소스 URL',
    missingOfficialJobPostingUrl: '공식 채용 공고 URL',
    missingHiringPeriod: '구인 기간',
    missingQualificationSummary: '자격 요건',
    missingJobDescriptionSummary: '직무 정보',
    missingApplicationDeadline: '지원 마감일',
    debug: 'Debug',
    debugOff: '기본 화면',
    dataUnavailable: '데이터를 불러오지 못했습니다.',
    noResults: '추천 결과가 없습니다.',
    loading: '추천 데이터를 불러오는 중입니다.',
    detailsTitle: '선택한 상세 정보',
    evidenceActions: '추천 증거 액션',
    risks: '리스크',
    qualifications: '자격',
    techStack: '기술 스택',
    experience: '경험',
    evidence: '증거',
    loadedCounts: '데이터 개수',
    validationSummary: '검증 요약',
    selectedDeveloperJson: '선택한 개발자 JSON',
    selectedCompanyJson: '선택한 기업 직무 JSON',
    selectedResultJson: '선택한 추천 결과 JSON',
    metadata: '메타데이터',
    fitVeryStrong: '매우 적합',
    fitStrong: '적합',
    fitPotential: '가능성 있음',
    fitNeedsPreparation: '준비 필요',
    fitLow: '낮은 적합도',
    nextApplyNow: '바로 지원',
    nextTrialProject: 'Trial Project',
    nextCasualInterview: '캐주얼 인터뷰',
    nextResearchCompany: '회사 확인',
    nextRewriteMotivation: '동기 보강',
    nextBridgeLabs: 'Bridge Labs 추천',
    actionSaveCandidate: '후보 저장',
    actionRequestPassport: '패스포트 요청',
    actionInviteOfficeTour: '오피스 투어 제안',
    actionCasualInterview: '캐주얼 인터뷰',
    actionTrialProject: 'Trial Project',
    actionRecommendBridgeLabs: 'Bridge Labs 추천',
    requiredSkillMatch: '필수 기술 일치',
    preferredSkillMatch: '우대 기술 일치',
    languageRequirementMatch: '언어 조건 일치',
    experienceLevelMatch: '경력 수준 일치',
    locationWorkstyleMatch: '지역/근무 방식 일치',
    motivationMatch: '동기 일치',
    rubricFit: '기준 적합도',
    evidenceConfidence: '증거 신뢰도',
    skillFit: '기술 적합도',
    roleFit: '직무 적합도',
    salaryFit: '연봉 적합도',
    locationFit: '지역 적합도',
    languageFit: '언어 적합도',
    experienceFit: '경력 적합도',
    workStyleFit: '근무 방식 적합도',
    safetyNote: '이 결과는 자동 채용 결정이 아니라 추천과 준비를 돕기 위한 참고 정보입니다.'
  },
  ja: {
    pageTitle: 'Bridge IT Signal Lab',
    subtitle: '履歴書と企業基準を比較して、合う企業と候補者を見つけます。',
    recommendationEngine: '推薦エンジン',
    roleSelectionTitle: '推薦エンジンの役割選択',
    roleSelectionSubtitle: '開発者向け推薦と企業向け推薦を分けて確認します。',
    developerRoleTitle: '開発者',
    developerRoleBody: '履歴書と希望条件に合う企業と職種を探します。',
    employerRoleTitle: 'Hiring Company',
    employerRoleBody: '企業の職種基準に合う候補者を探します。',
    chooseRole: '選択する',
    developerMode: '開発者向け',
    employerMode: '企業向け',
    profileTitle: '自分の履歴書 / プロフィール',
    companyResultsTitle: '自分に合う企業と職種',
    companyCriteriaTitle: '企業の職種条件',
    candidateResultsTitle: 'この職種に合う候補者',
    selectDeveloper: 'サンプル開発者を選択',
    selectRole: '企業 + 職種を選択',
    name: '名前',
    nationality: '国籍',
    targetRoles: '希望職種',
    techStacks: '技術スタック',
    languageCertifications: '語学資格',
    yearsOfExperience: '経験年数',
    preferredLocations: '希望勤務地',
    preferredSalary: '希望年収',
    workStyle: '勤務スタイル',
    resumeSummary: '履歴書サマリー',
    motivation: '志望動機',
    concerns: '懸念点',
    location: '勤務地',
    salary: '年収',
    hiringPeriod: '募集期間',
    jobPostingStatus: '募集状況',
    language: '言語',
    qualificationSummary: '応募条件',
    requiredTechStacks: '必須技術',
    preferredTechStacks: '歓迎技術',
    requiredLanguages: '必須言語',
    experienceRange: '経験範囲',
    whatMatches: '合っている点',
    whatMissing: 'さらに必要なこと',
    nextStep: '次のステップ',
    viewDetails: '詳細を見る',
    scoreDetails: 'スコア詳細',
    keySignals: '主要シグナル',
    strengths: '強み',
    missingEvidence: '不足している証拠',
    recommendedAction: '推奨アクション',
    confirmationNeeded: '確認が必要',
    salaryConfirmationNeeded: '年収確認が必要',
    hiringPeriodConfirmationNeeded: '募集期間確認が必要',
    locationConfirmationNeeded: '勤務地確認が必要',
    languageRequirementConfirmationNeeded: '言語条件確認が必要',
    qualificationConfirmationNeeded: '応募条件確認が必要',
    jobPostingStatusConfirmationNeeded: '募集状況確認が必要',
    sourceConfidence: 'ソース信頼度',
    missingData: '検証が必要なデータ',
    missingLogo: 'ロゴ',
    missingSalary: '年収',
    missingLocation: '勤務地',
    missingLanguageRequirement: '言語条件',
    missingExperienceRange: '経験範囲',
    missingRequiredTechStacks: '必須技術',
    missingPreferredTechStacks: '歓迎技術',
    missingWorkStyle: '勤務スタイル',
    missingRoleSpecificSource: '職種別ソース',
    missingOfficialSourceUrl: '公式ソースURL',
    missingOfficialJobPostingUrl: '公式求人URL',
    missingHiringPeriod: '募集期間',
    missingQualificationSummary: '応募条件',
    missingJobDescriptionSummary: '職務情報',
    missingApplicationDeadline: '応募締切',
    debug: 'Debug',
    debugOff: '通常表示',
    dataUnavailable: 'データを読み込めませんでした。',
    noResults: '推薦結果がありません。',
    loading: '推薦データを読み込み中です。',
    detailsTitle: '選択した詳細',
    evidenceActions: '推奨エビデンスアクション',
    risks: 'リスク',
    qualifications: '資格',
    techStack: '技術スタック',
    experience: '経験',
    evidence: '証拠',
    loadedCounts: 'データ件数',
    validationSummary: '検証サマリー',
    selectedDeveloperJson: '選択した開発者 JSON',
    selectedCompanyJson: '選択した企業職種 JSON',
    selectedResultJson: '選択した推薦結果 JSON',
    metadata: 'メタデータ',
    fitVeryStrong: '非常に高いフィット',
    fitStrong: '高いフィット',
    fitPotential: '可能性あり',
    fitNeedsPreparation: '準備が必要',
    fitLow: '低いフィット',
    nextApplyNow: '今すぐ応募',
    nextTrialProject: 'Trial Project',
    nextCasualInterview: 'カジュアル面談',
    nextResearchCompany: '企業確認',
    nextRewriteMotivation: '動機補強',
    nextBridgeLabs: 'Bridge Labs案内',
    actionSaveCandidate: '候補者を保存',
    actionRequestPassport: 'パスポートを依頼',
    actionInviteOfficeTour: 'オフィス見学を提案',
    actionCasualInterview: 'カジュアル面談',
    actionTrialProject: 'Trial Project',
    actionRecommendBridgeLabs: 'Bridge Labs案内',
    requiredSkillMatch: '必須技術一致',
    preferredSkillMatch: '歓迎技術一致',
    languageRequirementMatch: '言語条件一致',
    experienceLevelMatch: '経験レベル一致',
    locationWorkstyleMatch: '勤務地/勤務スタイル一致',
    motivationMatch: '志望動機一致',
    rubricFit: '基準適合度',
    evidenceConfidence: '証拠信頼度',
    skillFit: '技術適合度',
    roleFit: '職種適合度',
    salaryFit: '年収適合度',
    locationFit: '勤務地適合度',
    languageFit: '言語適合度',
    experienceFit: '経験適合度',
    workStyleFit: '勤務スタイル適合度',
    safetyNote: 'この結果は自動的な採用判断ではなく、発見・準備・人による確認のための参考情報です。'
  },
  en: {
    pageTitle: 'Bridge IT Signal Lab',
    subtitle: 'Compare resumes and company criteria to find better matches.',
    recommendationEngine: 'Recommendation Engine',
    roleSelectionTitle: 'Choose a Signal Lab role',
    roleSelectionSubtitle: 'Developer recommendations and employer recommendations now run as separate views.',
    developerRoleTitle: 'Developer',
    developerRoleBody: 'Find best-fit companies and roles for a resume and preferences.',
    employerRoleTitle: 'Hiring Company',
    employerRoleBody: 'Find best-fit candidates for company role requirements.',
    chooseRole: 'Choose role',
    developerMode: 'For Developers',
    employerMode: 'For Employers',
    profileTitle: 'Resume / Profile',
    companyResultsTitle: 'Best-fit companies and roles',
    companyCriteriaTitle: 'Company job criteria',
    candidateResultsTitle: 'Best-fit candidates for this role',
    selectDeveloper: 'Select a sample developer',
    selectRole: 'Select company + role',
    name: 'Name',
    nationality: 'Nationality',
    targetRoles: 'Target roles',
    techStacks: 'Tech stacks',
    languageCertifications: 'Language certifications',
    yearsOfExperience: 'Years of experience',
    preferredLocations: 'Preferred locations',
    preferredSalary: 'Preferred salary',
    workStyle: 'Work style',
    resumeSummary: 'Resume summary',
    motivation: 'Motivation',
    concerns: 'Concerns',
    location: 'Location',
    salary: 'Salary',
    hiringPeriod: 'Hiring period',
    jobPostingStatus: 'Posting status',
    language: 'Language',
    qualificationSummary: 'Qualifications',
    requiredTechStacks: 'Required tech',
    preferredTechStacks: 'Preferred tech',
    requiredLanguages: 'Required languages',
    experienceRange: 'Experience range',
    whatMatches: 'What matches',
    whatMissing: 'What is missing',
    nextStep: 'Next step',
    viewDetails: 'View details',
    scoreDetails: 'Score details',
    keySignals: 'Key signals',
    strengths: 'Strengths',
    missingEvidence: 'Missing evidence',
    recommendedAction: 'Recommended action',
    confirmationNeeded: 'Confirmation needed',
    salaryConfirmationNeeded: 'Salary confirmation needed',
    hiringPeriodConfirmationNeeded: 'Hiring period confirmation needed',
    locationConfirmationNeeded: 'Location confirmation needed',
    languageRequirementConfirmationNeeded: 'Language requirement confirmation needed',
    qualificationConfirmationNeeded: 'Qualification confirmation needed',
    jobPostingStatusConfirmationNeeded: 'Posting status confirmation needed',
    sourceConfidence: 'Source confidence',
    missingData: 'Data to verify',
    missingLogo: 'Logo',
    missingSalary: 'Salary',
    missingLocation: 'Location',
    missingLanguageRequirement: 'Language requirement',
    missingExperienceRange: 'Experience range',
    missingRequiredTechStacks: 'Required tech',
    missingPreferredTechStacks: 'Preferred tech',
    missingWorkStyle: 'Work style',
    missingRoleSpecificSource: 'Role-specific source',
    missingOfficialSourceUrl: 'Official source URL',
    missingOfficialJobPostingUrl: 'Official job posting URL',
    missingHiringPeriod: 'Hiring period',
    missingQualificationSummary: 'Qualifications',
    missingJobDescriptionSummary: 'Job information',
    missingApplicationDeadline: 'Application deadline',
    debug: 'Debug',
    debugOff: 'Default view',
    dataUnavailable: 'Failed to load recommendation data.',
    noResults: 'No recommendations available.',
    loading: 'Loading recommendation data.',
    detailsTitle: 'Selected details',
    evidenceActions: 'Recommended evidence actions',
    risks: 'Risks',
    qualifications: 'Qualifications',
    techStack: 'Tech stack',
    experience: 'Experience',
    evidence: 'Evidence',
    loadedCounts: 'Loaded data counts',
    validationSummary: 'Validation summary',
    selectedDeveloperJson: 'Selected developer JSON',
    selectedCompanyJson: 'Selected company profile JSON',
    selectedResultJson: 'Selected ranking result JSON',
    metadata: 'Metadata',
    fitVeryStrong: 'Very strong',
    fitStrong: 'Strong',
    fitPotential: 'Potential',
    fitNeedsPreparation: 'Needs preparation',
    fitLow: 'Low fit',
    nextApplyNow: 'Apply now',
    nextTrialProject: 'Trial Project',
    nextCasualInterview: 'Casual interview',
    nextResearchCompany: 'Research company',
    nextRewriteMotivation: 'Revise motivation',
    nextBridgeLabs: 'Bridge Labs',
    actionSaveCandidate: 'Save candidate',
    actionRequestPassport: 'Request passport',
    actionInviteOfficeTour: 'Invite office tour',
    actionCasualInterview: 'Casual interview',
    actionTrialProject: 'Trial Project',
    actionRecommendBridgeLabs: 'Recommend Bridge Labs',
    requiredSkillMatch: 'Required skill match',
    preferredSkillMatch: 'Preferred skill match',
    languageRequirementMatch: 'Language requirement match',
    experienceLevelMatch: 'Experience level match',
    locationWorkstyleMatch: 'Location / work style match',
    motivationMatch: 'Motivation match',
    rubricFit: 'Criteria fit',
    evidenceConfidence: 'Evidence confidence',
    skillFit: 'Skill fit',
    roleFit: 'Role fit',
    salaryFit: 'Salary fit',
    locationFit: 'Location fit',
    languageFit: 'Language fit',
    experienceFit: 'Experience fit',
    workStyleFit: 'Work style fit',
    safetyNote: 'These results are not automated hiring decisions. They are guidance for discovery, preparation, and human review.'
  }
} satisfies Record<Locale, Record<string, string>>;

const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'EN' }
];

const developerScoreKeys: Array<[keyof DeveloperToCompanyScoreBreakdown, CopyKey]> = [
  ['skillFit', 'skillFit'],
  ['roleFit', 'roleFit'],
  ['salaryFit', 'salaryFit'],
  ['locationFit', 'locationFit'],
  ['languageFit', 'languageFit'],
  ['experienceFit', 'experienceFit'],
  ['workStyleFit', 'workStyleFit'],
  ['rubricFit', 'rubricFit'],
  ['evidenceConfidence', 'evidenceConfidence']
];

const employerScoreKeys: Array<[keyof CompanyToDeveloperScoreBreakdown, CopyKey]> = [
  ['requiredSkillMatch', 'requiredSkillMatch'],
  ['preferredSkillMatch', 'preferredSkillMatch'],
  ['languageRequirementMatch', 'languageRequirementMatch'],
  ['experienceLevelMatch', 'experienceLevelMatch'],
  ['locationWorkstyleMatch', 'locationWorkstyleMatch'],
  ['motivationMatch', 'motivationMatch'],
  ['rubricFit', 'rubricFit'],
  ['evidenceConfidence', 'evidenceConfidence']
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatList(values: string[] | undefined, fallback: string) {
  return values && values.length ? values.join(', ') : fallback;
}

function formatDeveloperLanguages(profile: DeveloperPreference, fallback: string) {
  if (!profile.languageCertifications.length) return fallback;
  return profile.languageCertifications
    .map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ''}`)
    .join(', ');
}

function normalizeWorkStyle(value: DeveloperPreference['workStylePreference'] | CompanyJobProfile['workStyle']) {
  if (value === 'hybrid') return 'Hybrid';
  if (value === 'remote') return 'Remote';
  if (value === 'onsite') return 'On-site';
  return 'Any';
}

function toDraft(profile: DeveloperPreference | null): DraftProfile {
  return {
    resumeText: profile?.resumeText ?? '',
    motivation: profile?.motivation ?? '',
    concernsText: profile?.concerns?.join('\n') ?? ''
  };
}

function buildEditableDeveloper(profile: DeveloperPreference | null, draft: DraftProfile): DeveloperPreference | null {
  if (!profile) return null;

  return {
    ...profile,
    resumeText: draft.resumeText,
    motivation: draft.motivation,
    concerns: draft.concernsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

function buildStrengthGroups(result: CompanyToDeveloperFitResult, developer: DeveloperPreference | undefined) {
  if (!developer) return [] as Array<{ title: 'qualifications' | 'techStack' | 'language' | 'experience' | 'evidence'; items: string[] }>;

  const qualifications = [
    ...developer.languageCertifications.map((item) => item.certification).filter((value): value is string => Boolean(value)),
    ...developer.targetRoles.slice(0, 2)
  ];
  const evidence = [
    developer.portfolioText ? 'Portfolio' : '',
    developer.motivation ? 'Motivation' : '',
    ...result.topMatchSignals.filter((item) => /documentation|collaboration|proof|portfolio|motivation/i.test(item))
  ];

  return [
    { title: 'qualifications' as const, items: [...new Set(qualifications)].filter(Boolean).slice(0, 4) },
    { title: 'techStack' as const, items: [...new Set(developer.availableTechStacks)].slice(0, 6) },
    {
      title: 'language' as const,
      items: developer.languageCertifications.map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ''}`)
    },
    {
      title: 'experience' as const,
      items: [`${developer.yearsOfExperience}y`, ...developer.targetRoles.slice(0, 2)]
    },
    { title: 'evidence' as const, items: [...new Set(evidence)].filter(Boolean).slice(0, 4) }
  ].filter((group) => group.items.length > 0);
}

function toneClasses(tone: ReturnType<typeof getFitTone>) {
  return {
    green: 'border-bridge-primary/40 bg-bridge-primary/15 text-bridge-teal',
    teal: 'border-bridge-teal/20 bg-bridge-teal/10 text-bridge-teal',
    amber: 'border-bridge-amber/20 bg-bridge-amber/10 text-bridge-amber',
    slate: 'border-gray-200 bg-gray-50 text-gray-600'
  }[tone];
}

function ScoreDetails({
  title,
  rows
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <details className="rounded-2xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink">{title}</summary>
      <div className="grid gap-3 border-t border-gray-100 px-4 py-4 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-gray-100 bg-bridge-paper px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-600">{row.label}</span>
              <span className="font-bold text-ink">{Math.round(row.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-bridge-teal" style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-ink">{title}</div>
      <pre className="max-h-80 overflow-auto px-4 py-4 text-xs leading-5 text-gray-600 thin-scrollbar">{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}

function CompanyLogo({ profile }: { profile: CompanyJobProfile }) {
  const [broken, setBroken] = useState(false);
  const logo = broken ? null : formatCompanyLogo(profile);
  if (!logo) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-bridge-paper text-sm font-bold text-gray-400">
        {profile.companyName.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logo.src}
      alt={logo.alt}
      onError={() => setBroken(true)}
      className="h-11 w-11 shrink-0 rounded-2xl border border-gray-200 bg-white object-contain p-1"
    />
  );
}

export default function SignalLabPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<PageData | null>(null);
  const [locale, setLocale] = useState<Locale>('ko');
  const [mode, setMode] = useState<Mode>('developer');
  const [requestedRole, setRequestedRole] = useState<Mode | null>(null);
  const [roleResolved, setRoleResolved] = useState(false);
  const [debug, setDebug] = useState(false);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedCompanyResultRoleId, setSelectedCompanyResultRoleId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [draft, setDraft] = useState<DraftProfile>({ resumeText: '', motivation: '', concernsText: '' });

  const t = (key: CopyKey) => copy[locale][key] ?? copy.ko[key] ?? key;

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get('role');
    const nextRole = role === 'employer' || role === 'developer' ? role : null;
    setRequestedRole(nextRole);
    if (nextRole) setMode(nextRole);
    setRoleResolved(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadState('loading');

      try {
        const [companyJobProfiles, companyRubrics, companySignals, developerProfiles, metadata] = await Promise.all([
          loadCompanyJobProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals(),
          loadSampleDeveloperProfiles(),
          loadFitEngineMetadata().catch(() => null)
        ]);

        if (!mounted) return;

        const validationSummary = validateCompanyJobProfiles(companyJobProfiles, companyRubrics);

        setData({
          companyJobProfiles,
          developerProfiles,
          metadata,
          validationSummary,
          companyRubrics,
          companySignals
        });
        setSelectedDeveloperId(developerProfiles[0]?.developerId ?? '');
        setSelectedRoleId(companyJobProfiles[0]?.roleId ?? '');
        setDraft(toDraft(developerProfiles[0] ?? null));
        setLoadState('ready');
      } catch (error) {
        if (!mounted) return;
        setLoadState('error');
        setErrorMessage(error instanceof Error ? error.message : t('dataUnavailable'));
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDeveloper = useMemo(() => {
    return data?.developerProfiles.find((profile) => profile.developerId === selectedDeveloperId) ?? data?.developerProfiles[0] ?? null;
  }, [data, selectedDeveloperId]);

  useEffect(() => {
    setDraft(toDraft(selectedDeveloper));
  }, [selectedDeveloperId, selectedDeveloper]);

  const editableDeveloper = useMemo(() => buildEditableDeveloper(selectedDeveloper, draft), [selectedDeveloper, draft]);

  const selectedCompanyProfile = useMemo(() => {
    return data?.companyJobProfiles.find((profile) => profile.roleId === selectedRoleId) ?? data?.companyJobProfiles[0] ?? null;
  }, [data, selectedRoleId]);

  const developerRanking = useMemo(() => {
    if (!data || !editableDeveloper) return [] as DeveloperToCompanyFitResult[];
    return rankCompaniesForDeveloper(editableDeveloper, data.companyJobProfiles, data.companyRubrics, data.companySignals).slice(0, 10);
  }, [data, editableDeveloper]);

  const employerRanking = useMemo(() => {
    if (!data || !selectedCompanyProfile) return [] as CompanyToDeveloperFitResult[];
    return rankDevelopersForCompany(selectedCompanyProfile, data.developerProfiles, data.companyRubrics, data.companySignals).slice(0, 10);
  }, [data, selectedCompanyProfile]);

  useEffect(() => {
    const firstRoleId = developerRanking[0]?.roleId ?? '';
    if (!developerRanking.some((item) => item.roleId === selectedCompanyResultRoleId)) {
      setSelectedCompanyResultRoleId(firstRoleId);
    }
  }, [developerRanking, selectedCompanyResultRoleId]);

  useEffect(() => {
    const firstCandidateId = employerRanking[0]?.developerId ?? '';
    if (!employerRanking.some((item) => item.developerId === selectedCandidateId)) {
      setSelectedCandidateId(firstCandidateId);
    }
  }, [employerRanking, selectedCandidateId]);

  const selectedCompanyResult = developerRanking.find((item) => item.roleId === selectedCompanyResultRoleId) ?? developerRanking[0] ?? null;
  const selectedCandidateResult = employerRanking.find((item) => item.developerId === selectedCandidateId) ?? employerRanking[0] ?? null;
  const selectedCandidateProfile = data?.developerProfiles.find((item) => item.developerId === selectedCandidateResult?.developerId);
  const activeMode = requestedRole ?? mode;

  if (!roleResolved || loadState === 'loading') {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">{t('loading')}</div>;
  }

  if (loadState === 'error' || !data) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-panel">
          <h1 className="text-2xl font-bold text-ink">{t('dataUnavailable')}</h1>
          <p className="mt-3 text-sm text-gray-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-bridge-teal">{t('recommendationEngine')}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{t('pageTitle')}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{t('subtitle')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                {localeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocale(option.value)}
                    className={classNames(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      locale === option.value ? 'bg-bridge-primary text-bridge-teal' : 'text-gray-500 hover:text-ink'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDebug((current) => !current)}
                className={classNames(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  debug ? 'border-bridge-teal bg-bridge-teal/10 text-bridge-teal' : 'border-gray-200 bg-white text-gray-500 hover:text-ink'
                )}
              >
                {debug ? t('debug') : t('debugOff')}
              </button>
            </div>
          </div>

          {requestedRole ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-bridge-primary/15 px-3 py-1.5 text-sm font-semibold text-bridge-teal">
                {activeMode === 'developer' ? t('developerMode') : t('employerMode')}
              </span>
              <a href="/signal-lab" className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-ink">
                {t('chooseRole')}
              </a>
            </div>
          ) : null}
        </header>

        {!requestedRole ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold text-bridge-teal">{t('roleSelectionTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">{t('roleSelectionSubtitle')}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <a href="/signal-lab?role=developer" className="rounded-3xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-bridge-primary hover:shadow-panel">
                <p className="text-sm font-semibold text-bridge-teal">{t('developerMode')}</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{t('developerRoleTitle')}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">{t('developerRoleBody')}</p>
                <span className="mt-5 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-sm font-bold text-ink">{t('chooseRole')}</span>
              </a>
              <a href="/signal-lab?role=employer" className="rounded-3xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-bridge-coral hover:shadow-panel">
                <p className="text-sm font-semibold text-bridge-coral">{t('employerMode')}</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{t('employerRoleTitle')}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">{t('employerRoleBody')}</p>
                <span className="mt-5 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">{t('chooseRole')}</span>
              </a>
            </div>
          </section>
        ) : activeMode === 'developer' ? (
          <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-panel lg:sticky lg:top-24">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-bridge-teal">{t('profileTitle')}</p>
                  <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">{t('selectDeveloper')}</label>
                  <select
                    value={selectedDeveloperId}
                    onChange={(event) => setSelectedDeveloperId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
                  >
                    {data.developerProfiles.map((profile) => (
                      <option key={profile.developerId} value={profile.developerId}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editableDeveloper ? (
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="grid gap-3 rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                      <p><span className="font-semibold text-ink">{t('name')}: </span>{editableDeveloper.name}</p>
                      <p><span className="font-semibold text-ink">{t('targetRoles')}: </span>{formatList(editableDeveloper.targetRoles, t('confirmationNeeded'))}</p>
                      <p><span className="font-semibold text-ink">{t('techStacks')}: </span>{formatList(editableDeveloper.availableTechStacks, t('confirmationNeeded'))}</p>
                      <p><span className="font-semibold text-ink">{t('languageCertifications')}: </span>{formatDeveloperLanguages(editableDeveloper, t('confirmationNeeded'))}</p>
                      <p><span className="font-semibold text-ink">{t('yearsOfExperience')}: </span>{editableDeveloper.yearsOfExperience}y</p>
                      <p><span className="font-semibold text-ink">{t('preferredLocations')}: </span>{formatList(editableDeveloper.preferredLocations, t('confirmationNeeded'))}</p>
                      <p><span className="font-semibold text-ink">{t('preferredSalary')}: </span>{formatSalaryRange(editableDeveloper.preferredSalaryMin, editableDeveloper.preferredSalaryMax, editableDeveloper.preferredCurrency, t('confirmationNeeded'))}</p>
                      <p><span className="font-semibold text-ink">{t('workStyle')}: </span>{normalizeWorkStyle(editableDeveloper.workStylePreference)}</p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">{t('resumeSummary')}</span>
                      <textarea
                        value={draft.resumeText}
                        onChange={(event) => setDraft((current) => ({ ...current, resumeText: event.target.value }))}
                        rows={3}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">{t('motivation')}</span>
                      <textarea
                        value={draft.motivation}
                        onChange={(event) => setDraft((current) => ({ ...current, motivation: event.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">{t('concerns')}</span>
                      <textarea
                        value={draft.concernsText}
                        onChange={(event) => setDraft((current) => ({ ...current, concernsText: event.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="space-y-5">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-bridge-teal">{t('companyResultsTitle')}</p>
                    <p className="mt-1 text-sm text-gray-500">Top 10</p>
                  </div>
                </div>

                <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-2 thin-scrollbar">
                  {developerRanking.length ? developerRanking.map((result, index) => {
                    const tone = getFitTone(result.overallFitScore);
                    const companyProfile = data.companyJobProfiles.find((item) => item.roleId === result.roleId) ?? data.companyJobProfiles[0];
                    const displayCompanyProfile = asDisplayProfile(companyProfile);
                    const jobPostingUrl = getJobPostingUrl(companyProfile);
                    return (
                      <article key={`${result.companyId}-${result.roleId}`} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-bold text-bridge-teal">#{index + 1}</span>
                              <span className={classNames('rounded-full border px-2.5 py-1 text-xs font-semibold', toneClasses(tone))}>
                                {t(getFitLabel(result.overallFitScore))}
                              </span>
                              <span className="text-xs font-semibold text-gray-400">{Math.round(result.overallFitScore)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CompanyLogo profile={companyProfile} />
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold text-ink">{result.companyName}</h3>
                                <p className="text-sm font-medium text-gray-500">{result.roleTitle}</p>
                                {debug ? <p className="mt-1 text-xs font-semibold text-gray-400">{t('sourceConfidence')}: {formatSourceConfidence(companyProfile)}</p> : null}
                              </div>
                            </div>
                            <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2 xl:grid-cols-3">
                              <p><span className="font-semibold text-ink">{t('location')}: </span>{formatLocationSummary(companyProfile, t('locationConfirmationNeeded'))}</p>
                              <p><span className="font-semibold text-ink">{t('salary')}: </span>{formatCompanySalarySummary(companyProfile, t('salaryConfirmationNeeded'))}</p>
                              <p><span className="font-semibold text-ink">{t('hiringPeriod')}: </span>{formatHiringPeriodSummary(companyProfile, t('hiringPeriodConfirmationNeeded'))}</p>
                              <p><span className="font-semibold text-ink">{t('jobPostingStatus')}: </span>{formatJobPostingStatus(companyProfile, t('jobPostingStatusConfirmationNeeded'))}</p>
                              <p><span className="font-semibold text-ink">{t('qualificationSummary')}: </span>{formatQualificationSummary(companyProfile, t('qualificationConfirmationNeeded'))}</p>
                              <p><span className="font-semibold text-ink">{t('language')}: </span>{formatLanguageSummary(companyProfile, t('languageRequirementConfirmationNeeded'))}</p>
                            </div>
                            {debug && displayCompanyProfile.missingFields?.length ? (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-semibold text-gray-400">{t('missingData')}</span>
                                {displayCompanyProfile.missingFields.slice(0, 4).map((field) => (
                                  <span key={`${result.roleId}-${field}`} className="rounded-full border border-bridge-amber/20 bg-bridge-amber/10 px-2 py-0.5 text-xs font-medium text-bridge-amber">
                                    {t(getMissingDataLabel(field))}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <p className="text-sm text-gray-600"><span className="font-semibold text-ink">{t('whatMatches')}: </span>{result.matchedReasons[0] ?? t('confirmationNeeded')}</p>
                            <p className="text-sm text-gray-600"><span className="font-semibold text-ink">{t('whatMissing')}: </span>{result.missingSignals[0] ?? t('confirmationNeeded')}</p>
                            <p className="text-sm text-gray-600"><span className="font-semibold text-ink">{t('nextStep')}: </span>{t(getDeveloperNextStepKey(result.recommendedNextStep))}</p>
                            {debug && jobPostingUrl ? <p className="text-xs text-gray-400">jobPostingUrl: {jobPostingUrl}</p> : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedCompanyResultRoleId(result.roleId)}
                            className={classNames(
                              'rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors',
                              selectedCompanyResult?.roleId === result.roleId
                                ? 'border-bridge-teal bg-bridge-teal/10 text-bridge-teal'
                                : 'border-gray-200 bg-white text-gray-600 hover:text-ink'
                            )}
                          >
                            {t('viewDetails')}
                          </button>
                        </div>
                      </article>
                    );
                  }) : <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">{t('noResults')}</div>}
                </div>
              </section>

              {selectedCompanyResult ? (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      {data.companyJobProfiles.find((item) => item.roleId === selectedCompanyResult.roleId) ? (
                        <CompanyLogo profile={data.companyJobProfiles.find((item) => item.roleId === selectedCompanyResult.roleId)!} />
                      ) : null}
                      <div>
                      <p className="text-sm font-semibold text-bridge-teal">{t('detailsTitle')}</p>
                      <h3 className="mt-1 text-2xl font-bold text-ink">{selectedCompanyResult.companyName}</h3>
                      <p className="text-sm text-gray-500">{selectedCompanyResult.roleTitle}</p>
                      </div>
                    </div>
                    <span className={classNames('rounded-full border px-3 py-1.5 text-sm font-semibold', toneClasses(getFitTone(selectedCompanyResult.overallFitScore)))}>
                      {t(getFitLabel(selectedCompanyResult.overallFitScore))} · {Math.round(selectedCompanyResult.overallFitScore)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                      <p className="text-sm font-semibold text-ink">{t('whatMatches')}</p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        {selectedCompanyResult.matchedReasons.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                      <p className="text-sm font-semibold text-ink">{t('whatMissing')}</p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        {selectedCompanyResult.missingSignals.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                    <p><span className="font-semibold text-ink">{t('nextStep')}: </span>{t(getDeveloperNextStepKey(selectedCompanyResult.recommendedNextStep))}</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                    <p className="text-sm font-semibold text-ink">{t('evidenceActions')}</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      {selectedCompanyResult.recommendedMissions.slice(0, 4).map((mission) => (
                        <li key={mission.missionId}>• {mission.title}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5">
                    <ScoreDetails
                      title={t('scoreDetails')}
                      rows={developerScoreKeys.map(([key, labelKey]) => ({ label: t(labelKey), value: selectedCompanyResult.scoreBreakdown[key] }))}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-panel lg:sticky lg:top-24">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-bridge-teal">{t('companyCriteriaTitle')}</p>
                  <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">{t('selectRole')}</label>
                  <select
                    value={selectedRoleId}
                    onChange={(event) => setSelectedRoleId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
                  >
                    {data.companyJobProfiles.map((profile) => (
                      <option key={profile.roleId} value={profile.roleId}>
                        {profile.companyName} / {profile.roleTitle}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCompanyProfile ? (
                  <div className="grid gap-3 rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                    <div className="mb-1 flex items-start gap-3">
                      <CompanyLogo profile={selectedCompanyProfile} />
                      <div>
                        <p className="font-semibold text-ink">{formatRoleTitle(selectedCompanyProfile)}</p>
                        {debug ? <p className="mt-1 text-xs font-semibold text-gray-400">{t('sourceConfidence')}: {formatSourceConfidence(selectedCompanyProfile)}</p> : null}
                      </div>
                    </div>
                    <p><span className="font-semibold text-ink">{t('location')}: </span>{formatLocationSummary(selectedCompanyProfile, t('locationConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('workStyle')}: </span>{selectedCompanyProfile.workStyle === 'unknown' ? t('confirmationNeeded') : normalizeWorkStyle(selectedCompanyProfile.workStyle)}</p>
                    <p><span className="font-semibold text-ink">{t('salary')}: </span>{formatCompanySalarySummary(selectedCompanyProfile, t('salaryConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('hiringPeriod')}: </span>{formatHiringPeriodSummary(selectedCompanyProfile, t('hiringPeriodConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('jobPostingStatus')}: </span>{formatJobPostingStatus(selectedCompanyProfile, t('jobPostingStatusConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('qualificationSummary')}: </span>{formatQualificationSummary(selectedCompanyProfile, t('qualificationConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('requiredTechStacks')}: </span>{formatList(selectedCompanyProfile.requiredTechStacks, t('confirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('preferredTechStacks')}: </span>{formatList(selectedCompanyProfile.preferredTechStacks, t('confirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('requiredLanguages')}: </span>{formatLanguageSummary(selectedCompanyProfile, t('languageRequirementConfirmationNeeded'))}</p>
                    <p><span className="font-semibold text-ink">{t('experienceRange')}: </span>{formatExperienceRange(selectedCompanyProfile, t('confirmationNeeded'))}</p>
                    {debug && asDisplayProfile(selectedCompanyProfile).missingFields?.length ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-xs font-semibold text-gray-400">{t('missingData')}</span>
                        {asDisplayProfile(selectedCompanyProfile).missingFields?.map((field) => (
                          <span key={`${selectedCompanyProfile.roleId}-${field}`} className="rounded-full border border-bridge-amber/20 bg-bridge-amber/10 px-2 py-0.5 text-xs font-medium text-bridge-amber">
                            {t(getMissingDataLabel(field))}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="space-y-5">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
                <div>
                  <p className="text-sm font-semibold text-bridge-teal">{t('candidateResultsTitle')}</p>
                  <p className="mt-1 text-sm text-gray-500">Top 10</p>
                </div>

                <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-2 thin-scrollbar">
                  {employerRanking.length ? employerRanking.map((result, index) => (
                    <article key={`${result.companyId}-${result.roleId}-${result.developerId}`} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold text-bridge-teal">#{index + 1}</span>
                            <span className={classNames('rounded-full border px-2.5 py-1 text-xs font-semibold', toneClasses(getFitTone(result.overallFitScore)))}>
                              {t(getFitLabel(result.overallFitScore))}
                            </span>
                            <span className="text-xs font-semibold text-gray-400">{Math.round(result.overallFitScore)}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-ink">{result.developerName}</h3>
                            <p className="text-sm text-gray-500">{data.developerProfiles.find((item) => item.developerId === result.developerId)?.nationality ?? t('confirmationNeeded')}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('keySignals')}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {deriveKeySignals(result, data.developerProfiles.find((item) => item.developerId === result.developerId)).map((signal) => (
                                <span key={`${result.developerId}-${signal}`} className="rounded-full border border-gray-200 bg-bridge-paper px-3 py-1 text-xs font-medium text-gray-600">
                                  {signal}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600"><span className="font-semibold text-ink">{t('recommendedAction')}: </span>{t(getRecruiterActionKey(result.recommendedRecruiterAction))}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(result.developerId)}
                          className={classNames(
                            'rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors',
                            selectedCandidateResult?.developerId === result.developerId
                              ? 'border-bridge-teal bg-bridge-teal/10 text-bridge-teal'
                              : 'border-gray-200 bg-white text-gray-600 hover:text-ink'
                          )}
                        >
                          {t('viewDetails')}
                        </button>
                      </div>
                    </article>
                  )) : <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">{t('noResults')}</div>}
                </div>
              </section>

              {selectedCandidateResult ? (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-bridge-teal">{t('detailsTitle')}</p>
                      <h3 className="mt-1 text-2xl font-bold text-ink">{selectedCandidateResult.developerName}</h3>
                      <p className="text-sm text-gray-500">{formatList(selectedCandidateProfile?.targetRoles, t('confirmationNeeded'))}</p>
                    </div>
                    <span className={classNames('rounded-full border px-3 py-1.5 text-sm font-semibold', toneClasses(getFitTone(selectedCandidateResult.overallFitScore)))}>
                      {t(getFitLabel(selectedCandidateResult.overallFitScore))}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                      <p><span className="font-semibold text-ink">{t('nationality')}: </span>{selectedCandidateProfile?.nationality ?? t('confirmationNeeded')}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">{t('resumeSummary')}: </span>{selectedCandidateProfile?.resumeText ?? t('confirmationNeeded')}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">{t('motivation')}: </span>{selectedCandidateProfile?.motivation ?? t('confirmationNeeded')}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                      <p><span className="font-semibold text-ink">{t('techStacks')}: </span>{formatList(selectedCandidateProfile?.availableTechStacks, t('confirmationNeeded'))}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">{t('languageCertifications')}: </span>{selectedCandidateProfile ? formatDeveloperLanguages(selectedCandidateProfile, t('confirmationNeeded')) : t('confirmationNeeded')}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">{t('yearsOfExperience')}: </span>{selectedCandidateProfile?.yearsOfExperience ?? t('confirmationNeeded')}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {buildStrengthGroups(selectedCandidateResult, selectedCandidateProfile).map((group) => (
                      <div key={group.title} className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                        <p className="text-sm font-semibold text-ink">{t(group.title)}</p>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                          {group.items.map((item) => <li key={`${group.title}-${item}`}>• {item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                      <p className="text-sm font-semibold text-ink">{t('missingEvidence')}</p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        {selectedCandidateResult.missingSignals.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                      <p className="text-sm font-semibold text-ink">{t('risks')}</p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        {selectedCandidateResult.risks.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                    <p><span className="font-semibold text-ink">{t('recommendedAction')}: </span>{t(getRecruiterActionKey(selectedCandidateResult.recommendedRecruiterAction))}</p>
                  </div>

                  <div className="mt-5">
                    <ScoreDetails
                      title={t('scoreDetails')}
                      rows={employerScoreKeys.map(([key, labelKey]) => ({ label: t(labelKey), value: selectedCandidateResult.scoreBreakdown[key] }))}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </section>
        )}

        {debug ? (
          <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-panel">
            <h2 className="text-lg font-bold text-ink">{t('debug')}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                <p className="font-semibold text-ink">{t('loadedCounts')}</p>
                <p className="mt-2">profiles: {data.companyJobProfiles.length}</p>
                <p>developers: {data.developerProfiles.length}</p>
                <p>rubrics: {data.companyRubrics.length}</p>
                <p>signals: {data.companySignals.length}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                <p className="font-semibold text-ink">{t('validationSummary')}</p>
                <p className="mt-2">total: {data.validationSummary.totalProfiles}</p>
                <p>valid: {data.validationSummary.validProfiles}</p>
                <p>warning: {data.validationSummary.warningProfiles}</p>
                <p>invalid: {data.validationSummary.invalidProfiles}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600 md:col-span-2">
                <p className="font-semibold text-ink">{t('metadata')}</p>
                <p className="mt-2">{data.metadata ? `${data.metadata.name} ${data.metadata.version} / ${data.metadata.generatedAt}` : t('confirmationNeeded')}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <JsonBlock title={t('selectedDeveloperJson')} value={editableDeveloper} />
              <JsonBlock title={t('selectedCompanyJson')} value={selectedCompanyProfile} />
              <JsonBlock title={t('selectedResultJson')} value={activeMode === 'developer' ? selectedCompanyResult : selectedCandidateResult} />
            </div>
          </section>
        ) : null}

        <footer className="rounded-3xl border border-gray-200 bg-white px-6 py-4 text-sm text-gray-500 shadow-panel">
          {t('safetyNote')}
        </footer>
      </div>
    </div>
  );
}