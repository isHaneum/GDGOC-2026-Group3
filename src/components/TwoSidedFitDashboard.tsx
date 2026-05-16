"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileJson,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadFitEngineMetadata,
  loadSampleDeveloperProfiles
} from "../lib/companyCriteria";
import {
  rankCompaniesForDeveloper,
  rankDevelopersForCompany,
  validateCompanyJobProfiles
} from "../lib/twoSidedFitEngine";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyJobProfilesValidationSummary,
  CompanyToDeveloperFitResult,
  CompanyToDeveloperScoreBreakdown,
  DeveloperPreference,
  DeveloperToCompanyFitResult,
  DeveloperToCompanyScoreBreakdown,
  EvidenceMission,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";

type DashboardData = {
  companyJobProfiles: CompanyJobProfile[];
  companyRubrics: CompanyEvaluationRubric[];
  companySignals: CompanyHiringSignal[];
  developerProfiles: DeveloperPreference[];
  metadata: FitEngineMetadata | null;
  validationSummary: CompanyJobProfilesValidationSummary;
};

type LoadState = "loading" | "ready" | "error";
type TabKey = "developerToCompany" | "companyToDeveloper";
type Locale = "ko" | "ja" | "en";
type CopyKey = keyof typeof dashboardCopy.en;
type ChipTone = "green" | "amber" | "rose" | "blue" | "slate";

const localeOptions: Array<{ locale: Locale; label: string }> = [
  { locale: "ko", label: "한국어" },
  { locale: "ja", label: "日本語" },
  { locale: "en", label: "EN" }
];

const dashboardCopy = {
  en: {
    twoSidedFitEngine: "Two-sided Fit Engine",
    subtitle: "Match developers and companies in both directions.",
    stopSearching: "Stop searching blindly. Find companies that fit your stack, goals, language level, salary expectations, and career constraints.",
    secondaryMessage: "BridgePass compares developer preferences with company-specific hiring criteria and turns gaps into evidence missions.",
    humanReviewRequired: "Human review required",
    companyProfiles: "Company Profiles",
    companyProfilesShort: "Company profiles",
    sampleDevelopers: "Sample Developers",
    sampleDevelopersShort: "Sample developers",
    companyRubrics: "Company Rubrics",
    rubrics: "Rubrics",
    warningProfiles: "Warning Profiles",
    ruleBasedScoringActive: "Rule-based scoring active",
    geminiOptional: "Gemini optional",
    bridgePassPosition: "BridgePass position",
    jobBoardsExplain: "Job boards show postings. BridgePass explains fit.",
    heroDescription: "This debug surface shows the matching logic in both directions, with gaps, risks, and preparation work visible before anyone applies or interviews.",
    developerPreferences: "Developer preferences",
    companySpecificCriteria: "Company-specific criteria",
    fitScoreGapAnalysis: "Fit score and gap analysis",
    evidenceMissionsBeforeApplying: "Evidence missions before applying",
    loadedFromCompanyProfiles: "Loaded from companyJobProfiles.json",
    loadedFromDevelopers: "Loaded from sampleDeveloperProfiles.json",
    companySpecificCriteriaAvailable: "Company-specific criteria available",
    warningsGuideData: "Warnings guide data enrichment",
    warningsExpected: "Warnings are expected because BridgePass does not invent unavailable salary or language data.",
    developerCompanyFit: "Developer → Company Fit",
    companyDeveloperFit: "Company → Developer Fit",
    developerProfile: "Developer Profile",
    candidatePreferenceView: "Candidate preference view",
    companyJobProfile: "Company Job Profile",
    hiringCriteriaView: "Hiring criteria view",
    topCompanyMatches: "Top company matches",
    bestFitCompaniesRoles: "Best-fit companies and roles",
    top10RankedByEngine: "Top 10 ranked by engine",
    previousCompany: "Previous company",
    nextCompany: "Next company",
    whyThisFits: "Why this fits",
    whatYouNeedNext: "What you need next",
    recommendedEvidenceMissions: "Recommended evidence missions",
    detailedScoreBreakdown: "Detailed score breakdown",
    matchedReasons: "Matched reasons",
    missingSignals: "Missing signals",
    risks: "Risks",
    recommendedNextStep: "Recommended next step",
    recommendedCandidates: "Recommended candidates",
    bestFitDevelopersRole: "Best-fit developers for this role",
    top10Candidates: "Top 10 candidates",
    keySignals: "Key signals",
    fitScore: "Fit score",
    viewDetails: "View details",
    selected: "Selected",
    candidateDetail: "Candidate detail",
    resumeSummary: "Resume summary",
    motivation: "Motivation",
    recommendedRecruiterAction: "Recommended recruiter action",
    dataQuality: "Data quality",
    validationDataQuality: "Validation / Data Quality",
    explainableDataQuality: "Explainable data quality status",
    warningsAreReviewPrompts: "Warnings are review prompts",
    totalProfiles: "Total profiles",
    validProfiles: "Valid profiles",
    invalidProfiles: "Invalid profiles",
    commonWarnings: "Common warnings",
    missingSalary: "Missing salary",
    missingLanguageRequirement: "Missing language requirement",
    fallbackSource: "Fallback source",
    lowSourceConfidence: "Low source confidence",
    missingExperienceRange: "Missing experience range",
    noMatchingRubricId: "No matching rubricId",
    dataQualityExplanation: "BridgePass intentionally marks missing salary, language, or location data instead of inventing it. This keeps the matching explainable and improves trust.",
    rawDebugJson: "Raw Debug JSON",
    inspectSelectedInputs: "Inspect selected inputs and top results",
    selectedDeveloperJson: "Selected developer JSON",
    selectedCompanyProfileJson: "Selected company profile JSON",
    selectedDeveloperToCompanyResultJson: "Selected developer-to-company result JSON",
    selectedCompanyToDeveloperResultJson: "Selected company-to-developer result JSON",
    validationSummaryJson: "Validation summary JSON",
    notAutomatedHiringDecision: "This score is not an automated hiring decision.",
    safetyGuidanceSignal: "It is a guidance signal for discovery, preparation, and human review.",
    dataset: "Dataset",
    generated: "Generated",
    loadingTitle: "Loading Two-sided Fit Engine",
    loadingDescription: "Company criteria data is loading from local JSON files.",
    dataUnavailable: "Data unavailable",
    companyCriteriaLoadFailed: "Company criteria data could not be loaded.",
    noSampleDevelopers: "No sample developers found.",
    noCompanyProfiles: "No company profiles found.",
    rankingFailed: "Ranking failed. Check Two-sided Fit Engine input data.",
    noMatchesYet: "No matched reasons yet.",
    noMissingSignals: "No missing signals detected.",
    noRisks: "No major risks detected.",
    noMissions: "No missions generated yet.",
    companyRank: "Company rank",
    candidateRank: "Candidate rank",
    overallFit: "Overall fit",
    rank: "Rank",
    name: "Name",
    nationality: "Nationality",
    preferredSalary: "Preferred salary",
    preferredLocations: "Preferred locations",
    availableTechStacks: "Available tech stacks",
    languageCertifications: "Language certifications",
    yearsOfExperience: "Years of experience",
    targetRoles: "Target roles",
    workStylePreference: "Work style preference",
    relocationAvailability: "Relocation availability",
    visaSupportNeeded: "Visa support needed",
    preferredCompanyTypes: "Preferred company types",
    concerns: "Concerns",
    companyName: "Company name",
    roleTitle: "Role title",
    country: "Country",
    companyType: "Company type",
    roleCategory: "Role category",
    workStyle: "Work style",
    requiredTechStacks: "Required tech stacks",
    preferredTechStacks: "Preferred tech stacks",
    requiredLanguages: "Required languages",
    locations: "Locations",
    salaryRange: "Salary range",
    experienceRange: "Experience range",
    sourceConfidence: "Source confidence",
    rubricId: "Rubric ID",
    notes: "Notes",
    reason: "Reason",
    proofCreated: "Proof created",
    category: "Category",
    unknown: "Unknown",
    available: "Available",
    notAvailable: "Not available",
    needed: "Needed",
    notNeeded: "Not needed",
    noConcernsListed: "No concerns listed",
    candidate: "candidate",
    skillFit: "Skill fit",
    roleFit: "Role fit",
    salaryFit: "Salary fit",
    locationFit: "Location fit",
    languageFit: "Language fit",
    experienceFit: "Experience fit",
    workStyleFit: "Work style fit",
    rubricFit: "Rubric fit",
    requiredSkillMatch: "Required skill match",
    preferredSkillMatch: "Preferred skill match",
    languageRequirementMatch: "Language requirement match",
    experienceLevelMatch: "Experience level match",
    locationWorkstyleMatch: "Location and workstyle match",
    motivationMatch: "Motivation match",
    evidenceConfidence: "Evidence confidence"
  },
  ko: {
    twoSidedFitEngine: "양방향 핏 엔진",
    subtitle: "개발자와 기업을 양방향으로 매칭합니다.",
    stopSearching: "무작정 찾지 마세요. 내 기술 스택, 목표, 언어 수준, 희망 연봉, 커리어 조건에 맞는 기업을 찾으세요.",
    secondaryMessage: "BridgePass는 개발자 선호와 기업별 채용 기준을 비교하고, 부족한 부분을 증거 미션으로 바꿉니다.",
    humanReviewRequired: "사람의 검토 필요",
    companyProfiles: "기업 프로필",
    companyProfilesShort: "기업 프로필",
    sampleDevelopers: "샘플 개발자",
    sampleDevelopersShort: "샘플 개발자",
    companyRubrics: "기업 루브릭",
    rubrics: "루브릭",
    warningProfiles: "경고 프로필",
    ruleBasedScoringActive: "룰 기반 점수 활성화",
    geminiOptional: "Gemini 선택 사항",
    bridgePassPosition: "BridgePass 관점",
    jobBoardsExplain: "채용 게시판은 공고를 보여줍니다. BridgePass는 핏을 설명합니다.",
    heroDescription: "이 디버그 화면은 지원이나 면접 전에 양방향 매칭 로직, 부족한 점, 리스크, 준비 과제를 보여줍니다.",
    developerPreferences: "개발자 선호",
    companySpecificCriteria: "기업별 기준",
    fitScoreGapAnalysis: "핏 점수와 갭 분석",
    evidenceMissionsBeforeApplying: "지원 전 증거 미션",
    loadedFromCompanyProfiles: "companyJobProfiles.json에서 로드",
    loadedFromDevelopers: "sampleDeveloperProfiles.json에서 로드",
    companySpecificCriteriaAvailable: "기업별 기준 사용 가능",
    warningsGuideData: "경고는 데이터 보강 지점입니다",
    warningsExpected: "BridgePass는 공개되지 않은 연봉이나 언어 데이터를 지어내지 않기 때문에 경고는 예상되는 상태입니다.",
    developerCompanyFit: "개발자 → 기업 핏",
    companyDeveloperFit: "기업 → 개발자 핏",
    developerProfile: "개발자 프로필",
    candidatePreferenceView: "지원자 선호 보기",
    companyJobProfile: "기업 직무 프로필",
    hiringCriteriaView: "채용 기준 보기",
    topCompanyMatches: "상위 기업 매치",
    bestFitCompaniesRoles: "나에게 맞는 기업과 직무",
    top10RankedByEngine: "엔진 기준 상위 10개",
    previousCompany: "이전 기업",
    nextCompany: "다음 기업",
    whyThisFits: "왜 맞는가",
    whatYouNeedNext: "더 필요한 것",
    recommendedEvidenceMissions: "추천 증거 미션",
    detailedScoreBreakdown: "상세 점수 보기",
    matchedReasons: "맞은 이유",
    missingSignals: "부족한 신호",
    risks: "리스크",
    recommendedNextStep: "추천 다음 단계",
    recommendedCandidates: "추천 후보자",
    bestFitDevelopersRole: "이 직무에 맞는 개발자",
    top10Candidates: "상위 10명 후보자",
    keySignals: "핵심 신호",
    fitScore: "핏 점수",
    viewDetails: "자세히 보기",
    selected: "선택됨",
    candidateDetail: "후보자 상세",
    resumeSummary: "이력서 요약",
    motivation: "지원 동기",
    recommendedRecruiterAction: "추천 리크루터 액션",
    dataQuality: "데이터 품질",
    validationDataQuality: "검증 / 데이터 품질",
    explainableDataQuality: "설명 가능한 데이터 품질 상태",
    warningsAreReviewPrompts: "경고는 검토 요청입니다",
    totalProfiles: "전체 프로필",
    validProfiles: "유효 프로필",
    invalidProfiles: "무효 프로필",
    commonWarnings: "주요 경고",
    missingSalary: "연봉 누락",
    missingLanguageRequirement: "언어 요구사항 누락",
    fallbackSource: "대체 출처",
    lowSourceConfidence: "낮은 출처 신뢰도",
    missingExperienceRange: "경력 범위 누락",
    noMatchingRubricId: "연결된 rubricId 없음",
    dataQualityExplanation: "BridgePass는 연봉, 언어, 위치 데이터가 없을 때 지어내지 않고 누락으로 표시합니다. 이 방식은 매칭을 설명 가능하게 만들고 신뢰를 높입니다.",
    rawDebugJson: "원본 디버그 JSON",
    inspectSelectedInputs: "선택된 입력과 상위 결과 확인",
    selectedDeveloperJson: "선택된 개발자 JSON",
    selectedCompanyProfileJson: "선택된 기업 프로필 JSON",
    selectedDeveloperToCompanyResultJson: "선택된 개발자→기업 결과 JSON",
    selectedCompanyToDeveloperResultJson: "선택된 기업→개발자 결과 JSON",
    validationSummaryJson: "검증 요약 JSON",
    notAutomatedHiringDecision: "이 점수는 자동 채용 결정이 아닙니다.",
    safetyGuidanceSignal: "탐색, 준비, 사람의 검토를 돕는 가이드 신호입니다.",
    dataset: "데이터셋",
    generated: "생성일",
    loadingTitle: "양방향 핏 엔진 로딩 중",
    loadingDescription: "기업 기준 데이터는 로컬 JSON 파일에서 로드됩니다.",
    dataUnavailable: "데이터를 사용할 수 없음",
    companyCriteriaLoadFailed: "기업 기준 데이터를 로드할 수 없습니다.",
    noSampleDevelopers: "샘플 개발자를 찾을 수 없습니다.",
    noCompanyProfiles: "기업 프로필을 찾을 수 없습니다.",
    rankingFailed: "랭킹에 실패했습니다. 양방향 핏 엔진 입력 데이터를 확인하세요.",
    noMatchesYet: "아직 직접 매칭된 이유가 없습니다.",
    noMissingSignals: "감지된 부족 신호가 없습니다.",
    noRisks: "큰 리스크가 감지되지 않았습니다.",
    noMissions: "아직 생성된 미션이 없습니다.",
    companyRank: "기업 순위",
    candidateRank: "후보자 순위",
    overallFit: "전체 핏",
    rank: "순위",
    name: "이름",
    nationality: "국적",
    preferredSalary: "희망 연봉",
    preferredLocations: "희망 지역",
    availableTechStacks: "보유 기술 스택",
    languageCertifications: "언어 자격",
    yearsOfExperience: "경력 연수",
    targetRoles: "목표 직무",
    workStylePreference: "선호 근무 방식",
    relocationAvailability: "이주 가능 여부",
    visaSupportNeeded: "비자 지원 필요 여부",
    preferredCompanyTypes: "선호 기업 유형",
    concerns: "우려 사항",
    companyName: "기업명",
    roleTitle: "직무명",
    country: "국가",
    companyType: "기업 유형",
    roleCategory: "직무 카테고리",
    workStyle: "근무 방식",
    requiredTechStacks: "필수 기술 스택",
    preferredTechStacks: "우대 기술 스택",
    requiredLanguages: "필수 언어",
    locations: "근무 지역",
    salaryRange: "연봉 범위",
    experienceRange: "경력 범위",
    sourceConfidence: "출처 신뢰도",
    rubricId: "루브릭 ID",
    notes: "메모",
    reason: "이유",
    proofCreated: "생성되는 증거",
    category: "카테고리",
    unknown: "알 수 없음",
    available: "가능",
    notAvailable: "불가",
    needed: "필요",
    notNeeded: "불필요",
    noConcernsListed: "등록된 우려 사항 없음",
    candidate: "후보자",
    skillFit: "기술 핏",
    roleFit: "직무 핏",
    salaryFit: "연봉 핏",
    locationFit: "지역 핏",
    languageFit: "언어 핏",
    experienceFit: "경력 핏",
    workStyleFit: "근무 방식 핏",
    rubricFit: "루브릭 핏",
    requiredSkillMatch: "필수 기술 일치",
    preferredSkillMatch: "우대 기술 일치",
    languageRequirementMatch: "언어 요구 일치",
    experienceLevelMatch: "경력 수준 일치",
    locationWorkstyleMatch: "지역/근무 방식 일치",
    motivationMatch: "동기 일치",
    evidenceConfidence: "증거 신뢰도"
  },
  ja: {
    twoSidedFitEngine: "双方向フィットエンジン",
    subtitle: "開発者と企業を双方向でマッチングします。",
    stopSearching: "やみくもに探すのをやめましょう。技術スタック、目標、言語レベル、希望年収、キャリア条件に合う企業を見つけます。",
    secondaryMessage: "BridgePassは開発者の希望と企業ごとの採用基準を比較し、不足点を証明ミッションに変えます。",
    humanReviewRequired: "人による確認が必要",
    companyProfiles: "企業プロフィール",
    companyProfilesShort: "企業プロフィール",
    sampleDevelopers: "サンプル開発者",
    sampleDevelopersShort: "サンプル開発者",
    companyRubrics: "企業ルーブリック",
    rubrics: "ルーブリック",
    warningProfiles: "警告プロフィール",
    ruleBasedScoringActive: "ルールベース採点が有効",
    geminiOptional: "Geminiは任意",
    bridgePassPosition: "BridgePassの視点",
    jobBoardsExplain: "求人サイトは募集を見せます。BridgePassはフィットを説明します。",
    heroDescription: "このデバッグ画面では、応募や面談の前に双方向のマッチングロジック、不足点、リスク、準備タスクを確認できます。",
    developerPreferences: "開発者の希望",
    companySpecificCriteria: "企業別の基準",
    fitScoreGapAnalysis: "フィットスコアとギャップ分析",
    evidenceMissionsBeforeApplying: "応募前の証明ミッション",
    loadedFromCompanyProfiles: "companyJobProfiles.jsonから読み込み",
    loadedFromDevelopers: "sampleDeveloperProfiles.jsonから読み込み",
    companySpecificCriteriaAvailable: "企業別基準を利用可能",
    warningsGuideData: "警告はデータ改善の手がかりです",
    warningsExpected: "BridgePassは未公開の年収や言語データを作らないため、警告は想定される状態です。",
    developerCompanyFit: "開発者 → 企業フィット",
    companyDeveloperFit: "企業 → 開発者フィット",
    developerProfile: "開発者プロフィール",
    candidatePreferenceView: "候補者の希望ビュー",
    companyJobProfile: "企業の職種プロフィール",
    hiringCriteriaView: "採用基準ビュー",
    topCompanyMatches: "上位企業マッチ",
    bestFitCompaniesRoles: "自分に合う企業と職種",
    top10RankedByEngine: "エンジンによる上位10件",
    previousCompany: "前の企業",
    nextCompany: "次の企業",
    whyThisFits: "合っている理由",
    whatYouNeedNext: "次に必要なこと",
    recommendedEvidenceMissions: "おすすめの証明ミッション",
    detailedScoreBreakdown: "詳細スコア内訳",
    matchedReasons: "一致した理由",
    missingSignals: "不足しているシグナル",
    risks: "リスク",
    recommendedNextStep: "おすすめの次のステップ",
    recommendedCandidates: "おすすめ候補者",
    bestFitDevelopersRole: "この職種に合う開発者",
    top10Candidates: "上位10名の候補者",
    keySignals: "主要シグナル",
    fitScore: "フィットスコア",
    viewDetails: "詳細を見る",
    selected: "選択中",
    candidateDetail: "候補者詳細",
    resumeSummary: "履歴書サマリー",
    motivation: "志望動機",
    recommendedRecruiterAction: "おすすめ採用担当アクション",
    dataQuality: "データ品質",
    validationDataQuality: "検証 / データ品質",
    explainableDataQuality: "説明可能なデータ品質ステータス",
    warningsAreReviewPrompts: "警告は確認ポイントです",
    totalProfiles: "全プロフィール",
    validProfiles: "有効プロフィール",
    invalidProfiles: "無効プロフィール",
    commonWarnings: "主な警告",
    missingSalary: "年収未入力",
    missingLanguageRequirement: "言語要件未入力",
    fallbackSource: "代替ソース",
    lowSourceConfidence: "低いソース信頼度",
    missingExperienceRange: "経験年数範囲未入力",
    noMatchingRubricId: "一致するrubricIdなし",
    dataQualityExplanation: "BridgePassは年収、言語、勤務地データがない場合、それを作らず未入力として表示します。これによりマッチングの説明可能性と信頼性を高めます。",
    rawDebugJson: "Raw Debug JSON",
    inspectSelectedInputs: "選択中の入力と上位結果を確認",
    selectedDeveloperJson: "選択中の開発者JSON",
    selectedCompanyProfileJson: "選択中の企業プロフィールJSON",
    selectedDeveloperToCompanyResultJson: "選択中の開発者→企業結果JSON",
    selectedCompanyToDeveloperResultJson: "選択中の企業→開発者結果JSON",
    validationSummaryJson: "検証サマリーJSON",
    notAutomatedHiringDecision: "このスコアは自動採用判断ではありません。",
    safetyGuidanceSignal: "発見、準備、人による確認のためのガイドシグナルです。",
    dataset: "データセット",
    generated: "生成日",
    loadingTitle: "双方向フィットエンジンを読み込み中",
    loadingDescription: "企業基準データはローカルJSONファイルから読み込まれます。",
    dataUnavailable: "データを利用できません",
    companyCriteriaLoadFailed: "企業基準データを読み込めませんでした。",
    noSampleDevelopers: "サンプル開発者が見つかりません。",
    noCompanyProfiles: "企業プロフィールが見つかりません。",
    rankingFailed: "ランキングに失敗しました。双方向フィットエンジンの入力データを確認してください。",
    noMatchesYet: "一致した理由はまだありません。",
    noMissingSignals: "不足シグナルは検出されていません。",
    noRisks: "大きなリスクは検出されていません。",
    noMissions: "ミッションはまだ生成されていません。",
    companyRank: "企業順位",
    candidateRank: "候補者順位",
    overallFit: "総合フィット",
    rank: "順位",
    name: "名前",
    nationality: "国籍",
    preferredSalary: "希望年収",
    preferredLocations: "希望勤務地",
    availableTechStacks: "利用可能な技術スタック",
    languageCertifications: "語学資格",
    yearsOfExperience: "経験年数",
    targetRoles: "希望職種",
    workStylePreference: "希望勤務スタイル",
    relocationAvailability: "転居可否",
    visaSupportNeeded: "ビザ支援の必要性",
    preferredCompanyTypes: "希望企業タイプ",
    concerns: "懸念点",
    companyName: "企業名",
    roleTitle: "職種名",
    country: "国",
    companyType: "企業タイプ",
    roleCategory: "職種カテゴリ",
    workStyle: "勤務スタイル",
    requiredTechStacks: "必須技術スタック",
    preferredTechStacks: "歓迎技術スタック",
    requiredLanguages: "必須言語",
    locations: "勤務地",
    salaryRange: "年収範囲",
    experienceRange: "経験範囲",
    sourceConfidence: "ソース信頼度",
    rubricId: "ルーブリックID",
    notes: "メモ",
    reason: "理由",
    proofCreated: "作成される証明",
    category: "カテゴリ",
    unknown: "不明",
    available: "可能",
    notAvailable: "不可",
    needed: "必要",
    notNeeded: "不要",
    noConcernsListed: "記載された懸念点なし",
    candidate: "候補者",
    skillFit: "技術フィット",
    roleFit: "職種フィット",
    salaryFit: "年収フィット",
    locationFit: "勤務地フィット",
    languageFit: "言語フィット",
    experienceFit: "経験フィット",
    workStyleFit: "勤務スタイルフィット",
    rubricFit: "ルーブリックフィット",
    requiredSkillMatch: "必須技術一致",
    preferredSkillMatch: "歓迎技術一致",
    languageRequirementMatch: "言語要件一致",
    experienceLevelMatch: "経験レベル一致",
    locationWorkstyleMatch: "勤務地/勤務スタイル一致",
    motivationMatch: "志望動機一致",
    evidenceConfidence: "証明信頼度"
  }
} satisfies Record<Locale, Record<string, string>>;

const developerScoreRows: Array<[keyof DeveloperToCompanyScoreBreakdown, CopyKey]> = [
  ["skillFit", "skillFit"],
  ["roleFit", "roleFit"],
  ["salaryFit", "salaryFit"],
  ["locationFit", "locationFit"],
  ["languageFit", "languageFit"],
  ["experienceFit", "experienceFit"],
  ["workStyleFit", "workStyleFit"],
  ["rubricFit", "rubricFit"]
];

const companyScoreRows: Array<[keyof CompanyToDeveloperScoreBreakdown, CopyKey]> = [
  ["requiredSkillMatch", "requiredSkillMatch"],
  ["preferredSkillMatch", "preferredSkillMatch"],
  ["languageRequirementMatch", "languageRequirementMatch"],
  ["experienceLevelMatch", "experienceLevelMatch"],
  ["locationWorkstyleMatch", "locationWorkstyleMatch"],
  ["motivationMatch", "motivationMatch"],
  ["evidenceConfidence", "evidenceConfidence"],
  ["rubricFit", "rubricFit"]
];

const warningExamples = [
  "missing salary",
  "missing language requirement",
  "fallback source",
  "low source confidence",
  "missing experience range",
  "no matching rubricId"
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function humanize(value: string | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeSignal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣一-龥ぁ-んァ-ン]+/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatList(values: string[] | undefined, emptyLabel: string) {
  if (!values?.length) return emptyLabel;
  return values.join(", ");
}

function formatSalary(
  min: number | undefined,
  max: number | undefined,
  currency: DeveloperPreference["preferredCurrency"] | CompanyJobProfile["salaryCurrency"],
  unknownLabel: string
) {
  if (currency === "unknown" || typeof min !== "number" || typeof max !== "number") {
    return unknownLabel;
  }

  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${currency} ${formatter.format(min)} - ${formatter.format(max)}`;
}

function formatExperience(profile: CompanyJobProfile, unknownLabel: string) {
  const { minYears, maxYears } = profile.experienceRange;
  if (typeof minYears !== "number" && typeof maxYears !== "number") return unknownLabel;
  if (typeof minYears === "number" && typeof maxYears === "number") return `${minYears} - ${maxYears} years`;
  if (typeof minYears === "number") return `${minYears}+ years`;
  return `Up to ${maxYears} years`;
}

function formatLanguages(languages: CompanyJobProfile["requiredLanguages"] | undefined, unknownLabel: string) {
  if (!languages?.length) return unknownLabel;
  return languages.map((item) => `${item.language} ${item.level}`).join(", ");
}

function formatDeveloperLanguages(developer: DeveloperPreference, unknownLabel: string) {
  if (!developer.languageCertifications.length) return unknownLabel;
  return developer.languageCertifications
    .map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ""}`)
    .join(", ");
}

function getCommonWarnings(summary: CompanyJobProfilesValidationSummary) {
  const counts = new Map<string, number>();
  for (const item of summary.warningsByCompany) {
    for (const warning of item.warnings) {
      counts.set(warning, (counts.get(warning) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}

function deriveKeySignals(result: CompanyToDeveloperFitResult, developer: DeveloperPreference | undefined) {
  if (!developer) return result.topMatchSignals.slice(0, 3);

  const topSignalText = normalizeSignal(result.topMatchSignals.join(" "));
  const techMatches = developer.availableTechStacks.filter((stack) => {
    const normalizedStack = normalizeSignal(stack);
    if (topSignalText.includes(normalizedStack)) return true;
    if (normalizedStack === "typescript" && topSignalText.includes("ts")) return true;
    if (normalizedStack === "javascript" && topSignalText.includes("js")) return true;
    if (normalizedStack === "reactnative" && topSignalText.includes("reactnative")) return true;
    return false;
  });

  const techSignals = techMatches.length ? techMatches : developer.availableTechStacks;
  const languageSignals = developer.languageCertifications.map((item) => {
    if (item.certification) return item.certification;
    return `${item.language} ${item.level}`;
  });
  const roleSignals = developer.targetRoles.map((role) => role.replace(/\s*Engineer$/i, ""));

  return unique([...techSignals, ...languageSignals, ...roleSignals]).slice(0, 3);
}

function warningLabel(warning: string, t: (key: CopyKey) => string) {
  const warningMap: Record<string, CopyKey> = {
    "missing salary": "missingSalary",
    "missing language requirement": "missingLanguageRequirement",
    "fallback source": "fallbackSource",
    "low source confidence": "lowSourceConfidence",
    "missing experience range": "missingExperienceRange",
    "no matching rubricId": "noMatchingRubricId"
  };

  return warningMap[warning] ? t(warningMap[warning]) : warning;
}

function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames("rounded-lg border border-slate-200 bg-white shadow-panel", className)}>
      {children}
    </section>
  );
}

function Badge({
  children,
  tone = "slate",
  icon: Icon
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  icon?: LucideIcon;
}) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return (
    <span className={classNames("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

function ChipList({
  title,
  values,
  tone,
  emptyLabel,
  limit
}: {
  title: string;
  values: string[];
  tone: ChipTone;
  emptyLabel: string;
  limit?: number;
}) {
  const displayedValues = typeof limit === "number" ? values.slice(0, limit) : values;

  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {displayedValues.length ? (
          displayedValues.map((value, index) => (
            <Badge key={`${title}-${value}-${index}`} tone={tone}>
              {value}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green"
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  helper: string;
  tone?: "green" | "amber" | "blue" | "slate";
}) {
  const iconTones = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={classNames("flex h-10 w-10 items-center justify-center rounded-lg", iconTones[tone])}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const score = clampScore(value);
  const tone = score >= 75 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{label}</span>
        <span className="shrink-0 text-sm font-bold text-slate-950">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <div className={classNames("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  wide
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={classNames("min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3", wide && "sm:col-span-2")}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{value}</div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}

function LoadingPanel() {
  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="flex w-full max-w-md items-center gap-4 p-6">
          <Loader2 className="animate-spin text-green-600" size={24} />
          <div>
            <p className="font-bold text-slate-950">{dashboardCopy.en.loadingTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{dashboardCopy.en.loadingDescription}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="w-full max-w-2xl p-6">
          <Badge tone="rose" icon={AlertTriangle}>{dashboardCopy.en.dataUnavailable}</Badge>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">{dashboardCopy.en.companyCriteriaLoadFailed}</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </Card>
      </div>
    </main>
  );
}

function MissionCard({ mission, t }: { mission: EvidenceMission; t: (key: CopyKey) => string }) {
  return (
    <article className="rounded-lg border border-green-100 bg-green-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-slate-950">{mission.title}</p>
        <Badge tone="green">{mission.category}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm text-slate-600">
        <div>
          <dt className="font-semibold text-slate-800">{t("proofCreated")}</dt>
          <dd className="mt-0.5">{mission.proofCreated}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">{t("reason")}</dt>
          <dd className="mt-0.5">{mission.reason}</dd>
        </div>
      </dl>
    </article>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
        <FileJson size={16} />
        {title}
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-5 text-slate-200 thin-scrollbar">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function ScoreAccordion({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-bold text-slate-900">
        {title}
        <ChevronDown className="shrink-0 text-slate-500 transition group-open:rotate-180" size={18} />
      </summary>
      <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2">{children}</div>
    </details>
  );
}

function DeveloperProfilePanel({
  developers,
  selectedDeveloper,
  selectedDeveloperId,
  onSelect,
  t
}: {
  developers: DeveloperPreference[];
  selectedDeveloper: DeveloperPreference | null;
  selectedDeveloperId: string;
  onSelect: (developerId: string) => void;
  t: (key: CopyKey) => string;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("developerProfile")}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{t("candidatePreferenceView")}</h2>
        </div>
        <select
          value={selectedDeveloperId}
          onChange={(event) => onSelect(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {developers.map((developer) => (
            <option key={developer.developerId} value={developer.developerId}>
              {developer.name}
            </option>
          ))}
        </select>
      </div>

      {!developers.length ? (
        <div className="mt-5">
          <EmptyPanel message={t("noSampleDevelopers")} />
        </div>
      ) : selectedDeveloper ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label={t("name")} value={selectedDeveloper.name} />
          <Field label={t("nationality")} value={selectedDeveloper.nationality} />
          <Field
            label={t("preferredSalary")}
            value={formatSalary(selectedDeveloper.preferredSalaryMin, selectedDeveloper.preferredSalaryMax, selectedDeveloper.preferredCurrency, t("unknown"))}
          />
          <Field label={t("preferredLocations")} value={formatList(selectedDeveloper.preferredLocations, t("unknown"))} />
          <Field label={t("availableTechStacks")} value={formatList(selectedDeveloper.availableTechStacks, t("unknown"))} wide />
          <Field label={t("languageCertifications")} value={formatDeveloperLanguages(selectedDeveloper, t("unknown"))} wide />
          <Field label={t("yearsOfExperience")} value={`${selectedDeveloper.yearsOfExperience} years`} />
          <Field label={t("targetRoles")} value={formatList(selectedDeveloper.targetRoles, t("unknown"))} />
          <Field label={t("workStylePreference")} value={humanize(selectedDeveloper.workStylePreference)} />
          <Field label={t("relocationAvailability")} value={selectedDeveloper.relocationAvailable ? t("available") : t("notAvailable")} />
          <Field label={t("visaSupportNeeded")} value={selectedDeveloper.visaSupportNeeded ? t("needed") : t("notNeeded")} />
          <Field label={t("preferredCompanyTypes")} value={formatList(selectedDeveloper.preferredCompanyTypes, t("unknown"))} />
          <Field label={t("resumeSummary")} value={selectedDeveloper.resumeText} wide />
          <Field label={t("motivation")} value={selectedDeveloper.motivation ?? t("unknown")} wide />
          <Field label={t("concerns")} value={formatList(selectedDeveloper.concerns, t("noConcernsListed"))} wide />
        </div>
      ) : null}
    </Card>
  );
}

function CompanyProfilePanel({
  profiles,
  selectedProfile,
  selectedRoleId,
  onSelect,
  t
}: {
  profiles: CompanyJobProfile[];
  selectedProfile: CompanyJobProfile | null;
  selectedRoleId: string;
  onSelect: (roleId: string) => void;
  t: (key: CopyKey) => string;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("companyJobProfile")}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{t("hiringCriteriaView")}</h2>
        </div>
        <select
          value={selectedRoleId}
          onChange={(event) => onSelect(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {profiles.map((profile) => (
            <option key={profile.roleId} value={profile.roleId}>
              {profile.companyName} / {profile.roleTitle}
            </option>
          ))}
        </select>
      </div>

      {!profiles.length ? (
        <div className="mt-5">
          <EmptyPanel message={t("noCompanyProfiles")} />
        </div>
      ) : selectedProfile ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label={t("companyName")} value={selectedProfile.companyName} />
          <Field label={t("roleTitle")} value={selectedProfile.roleTitle} />
          <Field label={t("country")} value={selectedProfile.country} />
          <Field label={t("companyType")} value={selectedProfile.companyType} />
          <Field label={t("roleCategory")} value={selectedProfile.roleCategory} />
          <Field label={t("workStyle")} value={humanize(selectedProfile.workStyle)} />
          <Field label={t("requiredTechStacks")} value={formatList(selectedProfile.requiredTechStacks, t("unknown"))} wide />
          <Field label={t("preferredTechStacks")} value={formatList(selectedProfile.preferredTechStacks, t("unknown"))} wide />
          <Field label={t("requiredLanguages")} value={formatLanguages(selectedProfile.requiredLanguages, t("unknown"))} />
          <Field label={t("locations")} value={formatList(selectedProfile.locations, t("unknown"))} />
          <Field
            label={t("salaryRange")}
            value={formatSalary(selectedProfile.salaryMin, selectedProfile.salaryMax, selectedProfile.salaryCurrency, t("unknown"))}
          />
          <Field label={t("experienceRange")} value={formatExperience(selectedProfile, t("unknown"))} />
          <Field label={t("sourceConfidence")} value={humanize(selectedProfile.sourceConfidence)} />
          <Field label={t("rubricId")} value={selectedProfile.rubricId} />
          <Field label={t("notes")} value={selectedProfile.notes ?? t("unknown")} wide />
        </div>
      ) : null}
    </Card>
  );
}

function CompanyRankNavigator({
  results,
  selectedIndex,
  onSelect,
  onPrevious,
  onNext,
  t
}: {
  results: DeveloperToCompanyFitResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  t: (key: CopyKey) => string;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("companyRank")}</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">{t("top10RankedByEngine")}</h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!results.length}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              {t("previousCompany")}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!results.length}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-green-600 px-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("nextCompany")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 thin-scrollbar" aria-label={t("companyRank")}>
          {results.map((result, index) => (
            <button
              key={`${result.companyId}-${result.roleId}`}
              type="button"
              onClick={() => onSelect(index)}
              className={classNames(
                "grid min-w-20 rounded-lg border px-3 py-2 text-left transition",
                selectedIndex === index
                  ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-green-200 hover:bg-green-50/50"
              )}
            >
              <span className="text-lg font-black">#{index + 1}</span>
              <span className="truncate text-xs font-semibold">{clampScore(result.overallFitScore)}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SelectedCompanyMatchCard({
  result,
  rank,
  t
}: {
  result: DeveloperToCompanyFitResult;
  rank: number;
  t: (key: CopyKey) => string;
}) {
  const missions = result.recommendedMissions.slice(0, 4);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">#{rank}</Badge>
              <Badge tone="blue" icon={BriefcaseBusiness}>
                {t("recommendedNextStep")}: {humanize(result.recommendedNextStep)}
              </Badge>
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">{result.companyName}</h3>
            <p className="mt-1 text-base font-semibold text-slate-600">{result.roleTitle}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("overallFit")}</p>
            <p className="mt-1 text-5xl font-black text-green-600">{clampScore(result.overallFitScore)}</p>
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">{result.explanation}</p>
      </div>

      <div className="grid gap-6 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChipList title={t("whyThisFits")} values={result.matchedReasons} tone="green" emptyLabel={t("noMatchesYet")} limit={5} />
          <ChipList title={t("whatYouNeedNext")} values={result.missingSignals} tone="amber" emptyLabel={t("noMissingSignals")} limit={5} />
        </div>

        {result.risks.length ? (
          <ChipList title={t("risks")} values={result.risks} tone="rose" emptyLabel={t("noRisks")} limit={4} />
        ) : null}

        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">{t("recommendedEvidenceMissions")}</p>
          {missions.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {missions.map((mission) => (
                <MissionCard key={mission.missionId} mission={mission} t={t} />
              ))}
            </div>
          ) : (
            <EmptyPanel message={t("noMissions")} />
          )}
        </div>

        <ScoreAccordion title={t("detailedScoreBreakdown")}>
          {developerScoreRows.map(([key, labelKey]) => (
            <ScoreBar key={key} label={t(labelKey)} value={result.scoreBreakdown[key]} />
          ))}
        </ScoreAccordion>
      </div>
    </Card>
  );
}

function CandidateRankingList({
  results,
  developers,
  selectedCandidateId,
  onSelect,
  t
}: {
  results: CompanyToDeveloperFitResult[];
  developers: DeveloperPreference[];
  selectedCandidateId: string;
  onSelect: (developerId: string) => void;
  t: (key: CopyKey) => string;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("recommendedCandidates")}</p>
          <h3 className="text-xl font-bold text-slate-950">{t("top10Candidates")}</h3>
        </div>
        <Badge tone="green" icon={BadgeCheck}>{t("humanReviewRequired")}</Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {results.map((result, index) => {
          const developer = developers.find((item) => item.developerId === result.developerId);
          const keySignals = deriveKeySignals(result, developer);
          const selected = selectedCandidateId === result.developerId;

          return (
            <button
              key={`${result.companyId}-${result.roleId}-${result.developerId}`}
              type="button"
              onClick={() => onSelect(result.developerId)}
              className={classNames(
                "grid gap-4 rounded-lg border p-4 text-left transition lg:grid-cols-[70px_minmax(0,1fr)_minmax(180px,0.8fr)_110px_150px]",
                selected
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-green-200 hover:bg-green-50/40"
              )}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("rank")}</p>
                <p className="mt-1 text-3xl font-black text-green-700">#{index + 1}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("name")}</p>
                <p className="mt-1 truncate text-lg font-bold text-slate-950">{result.developerName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {developer?.nationality ?? t("unknown")} {t("candidate")}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("keySignals")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {keySignals.map((signal) => (
                    <Badge key={`${result.developerId}-${signal}`} tone="slate">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("fitScore")}</p>
                <p className="mt-1 text-3xl font-black text-green-600">{clampScore(result.overallFitScore)}</p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <Badge tone="blue">{humanize(result.recommendedRecruiterAction)}</Badge>
                <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  {selected ? t("selected") : t("viewDetails")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function CandidateDetailPanel({
  result,
  developer,
  t
}: {
  result: CompanyToDeveloperFitResult | null;
  developer: DeveloperPreference | undefined;
  t: (key: CopyKey) => string;
}) {
  if (!result) {
    return <EmptyPanel message={t("rankingFailed")} />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("candidateDetail")}</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-950">{result.developerName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {developer?.nationality ?? t("unknown")} / {formatList(developer?.targetRoles, t("unknown"))}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("overallFit")}</p>
            <p className="mt-1 text-5xl font-black text-green-600">{clampScore(result.overallFitScore)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="blue">{t("recommendedRecruiterAction")}: {humanize(result.recommendedRecruiterAction)}</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("name")} value={result.developerName} />
          <Field label={t("nationality")} value={developer?.nationality ?? t("unknown")} />
          <Field label={t("targetRoles")} value={formatList(developer?.targetRoles, t("unknown"))} />
          <Field label={t("languageCertifications")} value={developer ? formatDeveloperLanguages(developer, t("unknown")) : t("unknown")} />
          <Field label={t("availableTechStacks")} value={formatList(developer?.availableTechStacks, t("unknown"))} wide />
          <Field label={t("resumeSummary")} value={developer?.resumeText ?? t("unknown")} wide />
          <Field label={t("motivation")} value={developer?.motivation ?? t("unknown")} wide />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ChipList title={t("matchedReasons")} values={result.topMatchSignals} tone="green" emptyLabel={t("noMatchesYet")} limit={6} />
          <ChipList title={t("missingSignals")} values={result.missingSignals} tone="amber" emptyLabel={t("noMissingSignals")} limit={6} />
          <ChipList title={t("risks")} values={result.risks} tone="rose" emptyLabel={t("noRisks")} limit={6} />
        </div>

        <ScoreAccordion title={t("detailedScoreBreakdown")}>
          {companyScoreRows.map(([key, labelKey]) => (
            <ScoreBar key={key} label={t(labelKey)} value={result.scoreBreakdown[key]} />
          ))}
        </ScoreAccordion>
      </div>
    </Card>
  );
}

function ValidationPanel({ summary, t }: { summary: CompanyJobProfilesValidationSummary; t: (key: CopyKey) => string }) {
  const commonWarnings = getCommonWarnings(summary);
  const warningLookup = new Set(commonWarnings.map(([warning]) => warning));
  const displayedWarnings = commonWarnings.length
    ? commonWarnings.slice(0, 8)
    : warningExamples.map((warning) => [warning, warningLookup.has(warning) ? 1 : 0] as [string, number]);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("validationDataQuality")}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{t("explainableDataQuality")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{t("dataQualityExplanation")}</p>
        </div>
        <Badge tone="amber" icon={AlertTriangle}>{t("warningsAreReviewPrompts")}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("totalProfiles")} value={summary.totalProfiles} />
        <Field label={t("validProfiles")} value={summary.validProfiles} />
        <Field label={t("warningProfiles")} value={summary.warningProfiles} />
        <Field label={t("invalidProfiles")} value={summary.invalidProfiles} />
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-bold text-slate-900">{t("commonWarnings")}</p>
        <div className="flex flex-wrap gap-2">
          {displayedWarnings.map(([warning, count]) => (
            <Badge key={warning} tone={count > 0 ? "amber" : "slate"}>
              {warningLabel(warning, t)}{count > 0 ? ` (${count})` : ""}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function TwoSidedFitDashboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedCompanyRoleId, setSelectedCompanyRoleId] = useState("");
  const [selectedCompanyRankIndex, setSelectedCompanyRankIndex] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("developerToCompany");
  const [locale, setLocale] = useState<Locale>("en");

  const t = (key: CopyKey) => dashboardCopy[locale][key] ?? dashboardCopy.en[key] ?? key;

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoadState("loading");
      try {
        const [companyJobProfiles, companyRubrics, companySignals, developerProfiles, metadata] = await Promise.all([
          loadCompanyJobProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals(),
          loadSampleDeveloperProfiles(),
          loadFitEngineMetadata().catch(() => null)
        ]);

        const validationSummary = validateCompanyJobProfiles(companyJobProfiles, companyRubrics);

        if (!mounted) return;
        setData({
          companyJobProfiles,
          companyRubrics,
          companySignals,
          developerProfiles,
          metadata,
          validationSummary
        });
        setSelectedDeveloperId((current) => current || developerProfiles[0]?.developerId || "");
        setSelectedCompanyRoleId((current) => current || companyJobProfiles[0]?.roleId || "");
        setLoadState("ready");
      } catch (caught) {
        if (!mounted) return;
        setLoadState("error");
        setErrorMessage(caught instanceof Error ? caught.message : dashboardCopy.en.companyCriteriaLoadFailed);
      }
    }

    void loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedCompanyRankIndex(0);
  }, [selectedDeveloperId]);

  const selectedDeveloper = useMemo(() => {
    if (!data) return null;
    return data.developerProfiles.find((developer) => developer.developerId === selectedDeveloperId) ?? data.developerProfiles[0] ?? null;
  }, [data, selectedDeveloperId]);

  const selectedCompanyProfile = useMemo(() => {
    if (!data) return null;
    return data.companyJobProfiles.find((profile) => profile.roleId === selectedCompanyRoleId) ?? data.companyJobProfiles[0] ?? null;
  }, [data, selectedCompanyRoleId]);

  const developerRanking = useMemo(() => {
    if (!data || !selectedDeveloper) return { results: [] as DeveloperToCompanyFitResult[], error: null as string | null };

    try {
      return {
        results: rankCompaniesForDeveloper(
          selectedDeveloper,
          data.companyJobProfiles,
          data.companyRubrics,
          data.companySignals
        ).slice(0, 10),
        error: null
      };
    } catch {
      return { results: [] as DeveloperToCompanyFitResult[], error: dashboardCopy.en.rankingFailed };
    }
  }, [data, selectedDeveloper]);

  const companyRanking = useMemo(() => {
    if (!data || !selectedCompanyProfile) return { results: [] as CompanyToDeveloperFitResult[], error: null as string | null };

    try {
      return {
        results: rankDevelopersForCompany(
          selectedCompanyProfile,
          data.developerProfiles,
          data.companyRubrics,
          data.companySignals
        ).slice(0, 10),
        error: null
      };
    } catch {
      return { results: [] as CompanyToDeveloperFitResult[], error: dashboardCopy.en.rankingFailed };
    }
  }, [data, selectedCompanyProfile]);

  useEffect(() => {
    const firstCandidateId = companyRanking.results[0]?.developerId ?? "";
    const currentCandidateExists = companyRanking.results.some((result) => result.developerId === selectedCandidateId);

    if (!currentCandidateExists) {
      setSelectedCandidateId(firstCandidateId);
    }
  }, [companyRanking.results, selectedCandidateId]);

  const selectedCompanyResult = developerRanking.results[selectedCompanyRankIndex] ?? developerRanking.results[0] ?? null;
  const selectedCandidateResult =
    companyRanking.results.find((result) => result.developerId === selectedCandidateId) ?? companyRanking.results[0] ?? null;
  const selectedCandidateDeveloper = data?.developerProfiles.find((developer) => developer.developerId === selectedCandidateResult?.developerId);

  const allProfilesHaveWarnings = Boolean(
    data &&
      data.validationSummary.totalProfiles > 0 &&
      data.validationSummary.warningProfiles + data.validationSummary.invalidProfiles >= data.validationSummary.totalProfiles
  );

  if (loadState === "loading") return <LoadingPanel />;
  if (loadState === "error" || !data) return <ErrorPanel message={errorMessage || dashboardCopy.en.companyCriteriaLoadFailed} />;

  function handlePreviousCompany() {
    setSelectedCompanyRankIndex((current) => {
      if (!developerRanking.results.length) return 0;
      return current === 0 ? developerRanking.results.length - 1 : current - 1;
    });
  }

  function handleNextCompany() {
    setSelectedCompanyRankIndex((current) => {
      if (!developerRanking.results.length) return 0;
      return current === developerRanking.results.length - 1 ? 0 : current + 1;
    });
  }

  return (
    <main
      className="min-h-screen bg-[#F8FAF7] px-4 py-6 text-slate-900 md:px-8"
      style={{
        fontFamily:
          '"Noto Sans KR", "Noto Sans JP", "Noto Sans", "Inter", system-ui, sans-serif'
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
                  <Sparkles size={16} />
                  BridgePass
                </span>
                <Badge tone="green" icon={ShieldCheck}>{t("humanReviewRequired")}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">{t("twoSidedFitEngine")}</h1>
              <p className="mt-2 text-lg font-semibold text-slate-700">{t("subtitle")}</p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{t("stopSearching")}</p>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{t("secondaryMessage")}</p>
            </div>

            <div className="grid gap-3">
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
                {localeOptions.map((option) => (
                  <button
                    key={option.locale}
                    type="button"
                    onClick={() => setLocale(option.locale)}
                    className={classNames(
                      "min-h-9 rounded-md px-3 text-sm font-bold transition",
                      locale === option.locale ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex max-w-md flex-wrap justify-end gap-2">
                <Badge tone="slate" icon={Building2}>{t("companyProfilesShort")} {data.companyJobProfiles.length}</Badge>
                <Badge tone="slate" icon={UserRound}>{t("sampleDevelopersShort")} {data.developerProfiles.length}</Badge>
                <Badge tone="slate" icon={Database}>{t("rubrics")} {data.companyRubrics.length}</Badge>
                <Badge tone="green" icon={CheckCircle2}>{t("ruleBasedScoringActive")}</Badge>
                <Badge tone="blue" icon={Sparkles}>{t("geminiOptional")}</Badge>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-green-200 bg-white p-5 shadow-panel">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("bridgePassPosition")}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t("jobBoardsExplain")}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t("heroDescription")}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {(["developerPreferences", "companySpecificCriteria", "fitScoreGapAnalysis", "evidenceMissionsBeforeApplying"] as CopyKey[]).map((step, index, steps) => (
                <div key={step} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="mt-3 text-sm font-bold leading-5 text-slate-950">{t(step)}</p>
                  {index < steps.length - 1 ? (
                    <ArrowRight className="absolute right-3 top-4 hidden text-green-600 md:block" size={18} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Building2} label={t("companyProfiles")} value={data.companyJobProfiles.length} helper={t("loadedFromCompanyProfiles")} />
          <KpiCard icon={UsersRound} label={t("sampleDevelopers")} value={data.developerProfiles.length} helper={t("loadedFromDevelopers")} tone="blue" />
          <KpiCard icon={Database} label={t("companyRubrics")} value={data.companyRubrics.length} helper={t("companySpecificCriteriaAvailable")} tone="slate" />
          <KpiCard icon={AlertTriangle} label={t("warningProfiles")} value={data.validationSummary.warningProfiles} helper={t("warningsGuideData")} tone="amber" />
        </section>

        {allProfilesHaveWarnings || data.validationSummary.warningProfiles > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {t("warningsExpected")}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-panel">
          <div className="grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("developerToCompany")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "developerToCompany" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <UserRound size={18} />
              {t("developerCompanyFit")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("companyToDeveloper")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "companyToDeveloper" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Building2 size={18} />
              {t("companyDeveloperFit")}
            </button>
          </div>
        </section>

        {activeTab === "developerToCompany" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.45fr)]">
            <DeveloperProfilePanel
              developers={data.developerProfiles}
              selectedDeveloper={selectedDeveloper}
              selectedDeveloperId={selectedDeveloperId}
              onSelect={setSelectedDeveloperId}
              t={t}
            />
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("topCompanyMatches")}</p>
                  <h2 className="text-2xl font-bold text-slate-950">{t("bestFitCompaniesRoles")}</h2>
                </div>
                <Badge tone="green" icon={Target}>{t("top10RankedByEngine")}</Badge>
              </div>
              {developerRanking.error ? (
                <EmptyPanel message={t("rankingFailed")} />
              ) : !data.companyJobProfiles.length ? (
                <EmptyPanel message={t("noCompanyProfiles")} />
              ) : developerRanking.results.length && selectedCompanyResult ? (
                <>
                  <CompanyRankNavigator
                    results={developerRanking.results}
                    selectedIndex={selectedCompanyRankIndex}
                    onSelect={setSelectedCompanyRankIndex}
                    onPrevious={handlePreviousCompany}
                    onNext={handleNextCompany}
                    t={t}
                  />
                  <SelectedCompanyMatchCard result={selectedCompanyResult} rank={selectedCompanyRankIndex + 1} t={t} />
                </>
              ) : (
                <EmptyPanel message={t("rankingFailed")} />
              )}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.45fr)]">
            <CompanyProfilePanel
              profiles={data.companyJobProfiles}
              selectedProfile={selectedCompanyProfile}
              selectedRoleId={selectedCompanyRoleId}
              onSelect={setSelectedCompanyRoleId}
              t={t}
            />
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("recommendedCandidates")}</p>
                  <h2 className="text-2xl font-bold text-slate-950">{t("bestFitDevelopersRole")}</h2>
                </div>
                <Badge tone="green" icon={BadgeCheck}>{t("humanReviewRequired")}</Badge>
              </div>
              {companyRanking.error ? (
                <EmptyPanel message={t("rankingFailed")} />
              ) : !data.developerProfiles.length ? (
                <EmptyPanel message={t("noSampleDevelopers")} />
              ) : companyRanking.results.length ? (
                <>
                  <CandidateRankingList
                    results={companyRanking.results}
                    developers={data.developerProfiles}
                    selectedCandidateId={selectedCandidateResult?.developerId ?? ""}
                    onSelect={setSelectedCandidateId}
                    t={t}
                  />
                  <CandidateDetailPanel result={selectedCandidateResult} developer={selectedCandidateDeveloper} t={t} />
                </>
              ) : (
                <EmptyPanel message={t("rankingFailed")} />
              )}
            </div>
          </section>
        )}

        <ValidationPanel summary={data.validationSummary} t={t} />

        <details className="group rounded-lg border border-slate-200 bg-white shadow-panel">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-700">{t("rawDebugJson")}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{t("inspectSelectedInputs")}</h2>
            </div>
            <ChevronDown className="shrink-0 text-slate-500 transition group-open:rotate-180" size={22} />
          </summary>
          <div className="grid gap-4 border-t border-slate-200 p-5">
            <JsonBlock title={t("selectedDeveloperJson")} value={selectedDeveloper} />
            <JsonBlock title={t("selectedCompanyProfileJson")} value={selectedCompanyProfile} />
            <JsonBlock title={t("selectedDeveloperToCompanyResultJson")} value={selectedCompanyResult} />
            <JsonBlock title={t("selectedCompanyToDeveloperResultJson")} value={selectedCandidateResult} />
            <JsonBlock title={t("validationSummaryJson")} value={data.validationSummary} />
          </div>
        </details>

        <footer className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={20} />
              <p>
                {t("notAutomatedHiringDecision")} {t("safetyGuidanceSignal")}
              </p>
            </div>
            {data.metadata ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge tone="blue">{t("dataset")} {data.metadata.version}</Badge>
                <Badge tone="blue">{t("generated")} {data.metadata.generatedAt}</Badge>
              </div>
            ) : null}
          </div>
        </footer>
      </div>
    </main>
  );
}

export default TwoSidedFitDashboard;
