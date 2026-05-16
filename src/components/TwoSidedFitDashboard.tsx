"use client";

import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  FileJson,
  Loader2,
  ShieldCheck,
  Sparkles,
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
type CopyKey = keyof typeof copy.en;
type ChipTone = "green" | "amber" | "rose" | "blue" | "slate";

const debugModeDefault = false;

const localeOptions: Array<{ locale: Locale; label: string }> = [
  { locale: "ko", label: "한국어" },
  { locale: "ja", label: "日本語" },
  { locale: "en", label: "EN" }
];

const copy = {
  en: {
    appTitle: "Career Fit",
    findCompanies: "Find Companies",
    findCandidates: "Find Candidates",
    bestFitCompanies: "Best-fit companies",
    bestFitCandidates: "Best-fit candidates",
    developerProfile: "Profile",
    profileDetails: "View profile details",
    companyProfile: "Role",
    roleDetails: "View role details",
    selectCompanyPrompt: "Select a company to view details.",
    selectCandidatePrompt: "Select a candidate to view details.",
    top10Companies: "Top 10 companies",
    top10Candidates: "Top 10 candidates",
    whatMatches: "What matches",
    whatYouNeedNext: "What you need next",
    nextStep: "Next step",
    evidenceMissions: "Recommended actions",
    details: "View details",
    selected: "Selected",
    fit: "Fit",
    score: "Score",
    fitVeryStrong: "Very strong",
    fitStrong: "Strong",
    fitPotential: "Potential",
    fitNeedsPreparation: "Needs preparation",
    fitLow: "Low fit",
    name: "Name",
    nationality: "Nationality",
    targetRoles: "Target roles",
    techStack: "Tech stack",
    language: "Language",
    languageQualifications: "Language qualifications",
    preferredLocation: "Preferred location",
    preferredSalary: "Preferred salary",
    company: "Company",
    role: "Role",
    location: "Location",
    salary: "Salary",
    confirmationNeeded: "confirmation needed",
    partialMatch: "partial match",
    keySignals: "Key signals",
    recruiterAction: "Recruiter action",
    candidateDetail: "Candidate detail",
    resumeSummary: "Resume summary",
    motivation: "Motivation",
    strongPoints: "Strong points",
    qualifications: "Qualifications",
    experience: "Experience",
    evidence: "Evidence",
    missingEvidence: "Missing evidence",
    risks: "Risks",
    scoreBreakdown: "Detailed score breakdown",
    noMatches: "No clear match yet.",
    noMissing: "No major gap detected.",
    noRisks: "No major risk detected.",
    noMissions: "No action generated yet.",
    unknown: "Unknown",
    years: "years",
    debugMode: "Debug mode",
    debugDetails: "Debug details",
    dataQuality: "Data quality",
    rawJson: "Raw JSON",
    internalFields: "Internal fields",
    sourceConfidence: "Source confidence",
    rubricId: "Rubric ID",
    notes: "Notes",
    unknownFieldsNote: "Unknown fields are intentionally left blank instead of invented.",
    totalProfiles: "Total profiles",
    validProfiles: "Valid profiles",
    warningProfiles: "Warning profiles",
    invalidProfiles: "Invalid profiles",
    commonWarnings: "Common warnings",
    safety: "This score is not an automated hiring decision. Use it for discovery, preparation, and human review.",
    loading: "Loading Career Fit",
    loadFailed: "Company criteria data could not be loaded.",
    noCompanies: "No company profiles found.",
    noDevelopers: "No sample developers found.",
    rankingFailed: "Ranking failed. Check input data.",
    actionApplyNow: "Apply now",
    actionTrialProject: "Trial project",
    actionCasualInterview: "Casual interview",
    actionResearchCompany: "Research company",
    actionRewriteMotivation: "Rewrite motivation",
    actionBridgeLabs: "Prepare more evidence",
    actionSaveCandidate: "Save candidate",
    actionRequestPassport: "Request passport",
    actionInviteOfficeTour: "Invite to office tour",
    actionRecommendBridgeLabs: "Ask for more evidence",
    requiredSkillMatch: "Required skills",
    preferredSkillMatch: "Preferred skills",
    languageRequirementMatch: "Language",
    experienceLevelMatch: "Experience",
    locationWorkstyleMatch: "Location/work style",
    motivationMatch: "Motivation",
    evidenceConfidence: "Evidence",
    skillFit: "Skills",
    roleFit: "Role",
    salaryFit: "Salary",
    locationFit: "Location",
    languageFit: "Language",
    experienceFit: "Experience",
    workStyleFit: "Work style",
    rubricFit: "Criteria"
  },
  ko: {
    appTitle: "Career Fit",
    findCompanies: "맞춤 기업 찾기",
    findCandidates: "맞춤 지원자 찾기",
    bestFitCompanies: "나에게 맞는 기업",
    bestFitCandidates: "이 직무에 맞는 지원자",
    developerProfile: "내 프로필",
    profileDetails: "프로필 상세 보기",
    companyProfile: "직무",
    roleDetails: "직무 상세 보기",
    selectCompanyPrompt: "기업을 선택하면 상세 내용을 볼 수 있습니다.",
    selectCandidatePrompt: "지원자를 선택하면 상세 내용을 볼 수 있습니다.",
    top10Companies: "상위 10개 기업",
    top10Candidates: "상위 10명 지원자",
    whatMatches: "맞는 점",
    whatYouNeedNext: "더 필요한 것",
    nextStep: "다음 단계",
    evidenceMissions: "추천 액션",
    details: "상세 보기",
    selected: "선택됨",
    fit: "핏",
    score: "점수",
    fitVeryStrong: "매우 강함",
    fitStrong: "강함",
    fitPotential: "가능성 있음",
    fitNeedsPreparation: "준비 필요",
    fitLow: "낮은 핏",
    name: "이름",
    nationality: "국적",
    targetRoles: "목표 직무",
    techStack: "기술 스택",
    language: "언어",
    languageQualifications: "언어 자격",
    preferredLocation: "희망 지역",
    preferredSalary: "희망 연봉",
    company: "기업",
    role: "직무",
    location: "지역",
    salary: "연봉",
    confirmationNeeded: "확인 필요",
    partialMatch: "부분적으로 맞음",
    keySignals: "핵심 신호",
    recruiterAction: "리크루터 액션",
    candidateDetail: "지원자 상세",
    resumeSummary: "이력서 요약",
    motivation: "지원 동기",
    strongPoints: "강점",
    qualifications: "자격",
    experience: "경험",
    evidence: "증거",
    missingEvidence: "부족한 증거",
    risks: "리스크",
    scoreBreakdown: "상세 점수 보기",
    noMatches: "아직 뚜렷한 매칭 근거가 없습니다.",
    noMissing: "큰 부족 항목이 없습니다.",
    noRisks: "큰 리스크가 없습니다.",
    noMissions: "아직 추천 액션이 없습니다.",
    unknown: "알 수 없음",
    years: "년",
    debugMode: "디버그 모드",
    debugDetails: "디버그 상세",
    dataQuality: "데이터 품질",
    rawJson: "원본 JSON",
    internalFields: "내부 필드",
    sourceConfidence: "출처 신뢰도",
    rubricId: "루브릭 ID",
    notes: "메모",
    unknownFieldsNote: "알 수 없는 필드는 지어내지 않고 비워둡니다.",
    totalProfiles: "전체 프로필",
    validProfiles: "유효 프로필",
    warningProfiles: "경고 프로필",
    invalidProfiles: "무효 프로필",
    commonWarnings: "주요 경고",
    safety: "이 점수는 자동 채용 결정이 아닙니다. 탐색, 준비, 사람의 검토를 위해 사용하세요.",
    loading: "Career Fit 로딩 중",
    loadFailed: "기업 기준 데이터를 로드할 수 없습니다.",
    noCompanies: "기업 프로필을 찾을 수 없습니다.",
    noDevelopers: "샘플 개발자를 찾을 수 없습니다.",
    rankingFailed: "랭킹에 실패했습니다. 입력 데이터를 확인하세요.",
    actionApplyNow: "바로 지원",
    actionTrialProject: "트라이얼 프로젝트",
    actionCasualInterview: "캐주얼 인터뷰",
    actionResearchCompany: "기업 리서치",
    actionRewriteMotivation: "지원 동기 정리",
    actionBridgeLabs: "증거 더 준비",
    actionSaveCandidate: "지원자 저장",
    actionRequestPassport: "패스포트 요청",
    actionInviteOfficeTour: "오피스 투어 제안",
    actionRecommendBridgeLabs: "추가 증거 요청",
    requiredSkillMatch: "필수 기술",
    preferredSkillMatch: "우대 기술",
    languageRequirementMatch: "언어",
    experienceLevelMatch: "경험",
    locationWorkstyleMatch: "지역/근무 방식",
    motivationMatch: "동기",
    evidenceConfidence: "증거",
    skillFit: "기술",
    roleFit: "직무",
    salaryFit: "연봉",
    locationFit: "지역",
    languageFit: "언어",
    experienceFit: "경험",
    workStyleFit: "근무 방식",
    rubricFit: "기준"
  },
  ja: {
    appTitle: "Career Fit",
    findCompanies: "自分に合う企業",
    findCandidates: "候補者を探す",
    bestFitCompanies: "自分に合う企業",
    bestFitCandidates: "この職種に合う候補者",
    developerProfile: "プロフィール",
    profileDetails: "プロフィール詳細を見る",
    companyProfile: "職種",
    roleDetails: "職種詳細を見る",
    selectCompanyPrompt: "企業を選択すると詳細を確認できます。",
    selectCandidatePrompt: "候補者を選択すると詳細を確認できます。",
    top10Companies: "上位10社",
    top10Candidates: "上位10名の候補者",
    whatMatches: "合っている点",
    whatYouNeedNext: "さらに必要なこと",
    nextStep: "次のステップ",
    evidenceMissions: "おすすめアクション",
    details: "詳細を見る",
    selected: "選択中",
    fit: "フィット",
    score: "スコア",
    fitVeryStrong: "非常に強い",
    fitStrong: "強い",
    fitPotential: "可能性あり",
    fitNeedsPreparation: "準備が必要",
    fitLow: "低いフィット",
    name: "名前",
    nationality: "国籍",
    targetRoles: "希望職種",
    techStack: "技術スタック",
    language: "言語",
    languageQualifications: "語学資格",
    preferredLocation: "希望勤務地",
    preferredSalary: "希望年収",
    company: "企業",
    role: "職種",
    location: "勤務地",
    salary: "年収",
    confirmationNeeded: "確認が必要",
    partialMatch: "一部一致",
    keySignals: "主要シグナル",
    recruiterAction: "採用担当アクション",
    candidateDetail: "候補者詳細",
    resumeSummary: "履歴書サマリー",
    motivation: "志望動機",
    strongPoints: "強み",
    qualifications: "資格",
    experience: "経験",
    evidence: "証拠",
    missingEvidence: "不足している証拠",
    risks: "リスク",
    scoreBreakdown: "詳細スコア内訳",
    noMatches: "明確な一致理由はまだありません。",
    noMissing: "大きな不足項目はありません。",
    noRisks: "大きなリスクはありません。",
    noMissions: "おすすめアクションはまだありません。",
    unknown: "不明",
    years: "年",
    debugMode: "デバッグモード",
    debugDetails: "デバッグ詳細",
    dataQuality: "データ品質",
    rawJson: "Raw JSON",
    internalFields: "内部フィールド",
    sourceConfidence: "ソース信頼度",
    rubricId: "ルーブリックID",
    notes: "メモ",
    unknownFieldsNote: "不明な項目は作らず空欄のままにしています。",
    totalProfiles: "全プロフィール",
    validProfiles: "有効プロフィール",
    warningProfiles: "警告プロフィール",
    invalidProfiles: "無効プロフィール",
    commonWarnings: "主な警告",
    safety: "このスコアは自動採用判断ではありません。発見、準備、人による確認に使用してください。",
    loading: "Career Fitを読み込み中",
    loadFailed: "企業基準データを読み込めませんでした。",
    noCompanies: "企業プロフィールが見つかりません。",
    noDevelopers: "サンプル開発者が見つかりません。",
    rankingFailed: "ランキングに失敗しました。入力データを確認してください。",
    actionApplyNow: "今すぐ応募",
    actionTrialProject: "トライアルプロジェクト",
    actionCasualInterview: "カジュアル面談",
    actionResearchCompany: "企業リサーチ",
    actionRewriteMotivation: "志望動機を整理",
    actionBridgeLabs: "証拠をさらに準備",
    actionSaveCandidate: "候補者を保存",
    actionRequestPassport: "パスポートを依頼",
    actionInviteOfficeTour: "オフィス見学を提案",
    actionRecommendBridgeLabs: "追加証拠を依頼",
    requiredSkillMatch: "必須技術",
    preferredSkillMatch: "歓迎技術",
    languageRequirementMatch: "言語",
    experienceLevelMatch: "経験",
    locationWorkstyleMatch: "勤務地/勤務スタイル",
    motivationMatch: "志望動機",
    evidenceConfidence: "証拠",
    skillFit: "技術",
    roleFit: "職種",
    salaryFit: "年収",
    locationFit: "勤務地",
    languageFit: "言語",
    experienceFit: "経験",
    workStyleFit: "勤務スタイル",
    rubricFit: "基準"
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

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSignal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣一-龥ぁ-んァ-ン]+/g, "");
}

function humanize(value: string | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(values: string[] | undefined, emptyLabel: string, limit?: number) {
  const visible = typeof limit === "number" ? values?.slice(0, limit) : values;
  return visible?.length ? visible.join(", ") : emptyLabel;
}

function formatSalaryValue(
  min: number | undefined,
  max: number | undefined,
  currency: DeveloperPreference["preferredCurrency"] | CompanyJobProfile["salaryCurrency"],
  fallback: string
) {
  if (currency === "unknown" || typeof min !== "number" || typeof max !== "number") return fallback;
  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${currency} ${formatter.format(min)} - ${formatter.format(max)}`;
}

function formatLanguages(developer: DeveloperPreference, emptyLabel: string) {
  if (!developer.languageCertifications.length) return emptyLabel;
  return developer.languageCertifications
    .map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ""}`)
    .join(", ");
}

function formatRoleLanguages(profile: CompanyJobProfile | undefined, t: (key: CopyKey) => string) {
  if (!profile) return `${t("language")}: ${t("confirmationNeeded")}`;
  if (profile.requiredLanguages.length) {
    return `${t("language")}: ${profile.requiredLanguages.map((item) => `${item.language} ${item.level}`).join(", ")}`;
  }
  if (profile.preferredLanguages?.length) {
    return `${t("language")}: ${t("partialMatch")}`;
  }
  return `${t("language")}: ${t("confirmationNeeded")}`;
}

function formatRoleSalary(profile: CompanyJobProfile | undefined, t: (key: CopyKey) => string) {
  if (!profile) return `${t("salary")}: ${t("confirmationNeeded")}`;
  const salary = formatSalaryValue(profile.salaryMin, profile.salaryMax, profile.salaryCurrency, "");
  return salary ? `${t("salary")}: ${salary}` : `${t("salary")}: ${t("confirmationNeeded")}`;
}

function formatRoleLocation(profile: CompanyJobProfile | undefined, t: (key: CopyKey) => string) {
  if (!profile || !profile.locations.length || profile.locations.includes("unknown")) {
    return `${t("location")}: ${t("confirmationNeeded")}`;
  }
  const location = profile.locations.slice(0, 2).join(", ");
  return `${t("location")}: ${profile.workStyle !== "unknown" ? `${location} / ${humanize(profile.workStyle)}` : location}`;
}

function fitLabelKey(score: number): CopyKey {
  if (score >= 85) return "fitVeryStrong";
  if (score >= 75) return "fitStrong";
  if (score >= 60) return "fitPotential";
  if (score >= 45) return "fitNeedsPreparation";
  return "fitLow";
}

function fitTone(score: number): ChipTone {
  if (score >= 75) return "green";
  if (score >= 60) return "blue";
  if (score >= 45) return "amber";
  return "rose";
}

function developerActionKey(action: DeveloperToCompanyFitResult["recommendedNextStep"]): CopyKey {
  const labels: Record<DeveloperToCompanyFitResult["recommendedNextStep"], CopyKey> = {
    apply_now: "actionApplyNow",
    trial_project: "actionTrialProject",
    casual_interview: "actionCasualInterview",
    research_company: "actionResearchCompany",
    rewrite_motivation: "actionRewriteMotivation",
    bridge_labs_activity: "actionBridgeLabs"
  };
  return labels[action];
}

function recruiterActionKey(action: CompanyToDeveloperFitResult["recommendedRecruiterAction"]): CopyKey {
  const labels: Record<CompanyToDeveloperFitResult["recommendedRecruiterAction"], CopyKey> = {
    save_candidate: "actionSaveCandidate",
    request_passport: "actionRequestPassport",
    invite_office_tour: "actionInviteOfficeTour",
    casual_interview: "actionCasualInterview",
    trial_project: "actionTrialProject",
    recommend_bridge_labs: "actionRecommendBridgeLabs"
  };
  return labels[action];
}

function extractRequiredSkill(signal: string) {
  const match = signal.match(/required skill:\s*(.+)$/i);
  return match?.[1]?.trim();
}

function deriveKeySignals(result: CompanyToDeveloperFitResult, developer: DeveloperPreference | undefined) {
  if (!developer) return result.topMatchSignals.slice(0, 3);

  const requiredMatches = result.topMatchSignals.map(extractRequiredSkill).filter((value): value is string => Boolean(value));
  const signalText = normalizeSignal(result.topMatchSignals.join(" "));
  const techMatches = developer.availableTechStacks.filter((stack) => signalText.includes(normalizeSignal(stack)));
  const languageSignals = developer.languageCertifications.map((item) => item.certification ?? `${item.language} ${item.level}`);
  const roleSignals = developer.targetRoles.map((role) => role.replace(/\s*Engineer$/i, ""));

  return unique([...requiredMatches, ...techMatches, ...developer.availableTechStacks, ...languageSignals, ...roleSignals]).slice(0, 3);
}

function buildStrongPointGroups(result: CompanyToDeveloperFitResult, developer: DeveloperPreference | undefined) {
  if (!developer) return [];

  const qualifications = unique([
    ...developer.languageCertifications.map((item) => item.certification ?? "").filter(Boolean),
    ...developer.targetRoles.slice(0, 2)
  ]);
  const language = developer.languageCertifications.map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ""}`);
  const experience = unique([`${developer.yearsOfExperience}y`, ...developer.targetRoles.slice(0, 2), humanize(developer.workStylePreference)]);
  const evidence = unique([
    developer.portfolioText ? "Portfolio" : "",
    developer.motivation ? "Motivation" : "",
    ...result.topMatchSignals.filter((signal) => /evidence|portfolio|collaboration|motivation|product/i.test(signal))
  ]);

  return [
    ["qualifications", qualifications],
    ["techStack", developer.availableTechStacks],
    ["language", language],
    ["experience", experience],
    ["evidence", evidence]
  ]
    .map(([key, items]) => ({ key: key as CopyKey, items: (items as string[]).slice(0, 5) }))
    .filter((group) => group.items.length);
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={classNames("rounded-lg border border-slate-200 bg-white shadow-panel", className)}>{children}</section>;
}

function Badge({ children, tone = "slate", icon: Icon }: { children: React.ReactNode; tone?: ChipTone; icon?: LucideIcon }) {
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

function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={classNames("min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3", wide && "sm:col-span-2")}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{value}</div>
    </div>
  );
}

function ChipList({
  values,
  tone,
  emptyLabel,
  limit
}: {
  values: string[];
  tone: ChipTone;
  emptyLabel: string;
  limit?: number;
}) {
  const displayed = typeof limit === "number" ? values.slice(0, limit) : values;

  if (!displayed.length) return <p className="text-sm text-slate-400">{emptyLabel}</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {displayed.map((value, index) => (
        <Badge key={`${value}-${index}`} tone={tone}>
          {value}
        </Badge>
      ))}
    </div>
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
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={classNames("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ScoreAccordion({ title, children }: { title: string; children: React.ReactNode }) {
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
          <p className="font-bold text-slate-950">{copy.en.loading}</p>
        </Card>
      </div>
    </main>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="w-full max-w-xl p-6">
          <Badge tone="rose" icon={AlertTriangle}>{copy.en.loadFailed}</Badge>
          <p className="mt-3 text-sm text-slate-600">{message}</p>
        </Card>
      </div>
    </main>
  );
}

function DeveloperProfileSummary({
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
  if (!developers.length) return <EmptyPanel message={t("noDevelopers")} />;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("developerProfile")}</p>
          <h2 className="text-xl font-bold text-slate-950">{selectedDeveloper?.name ?? t("unknown")}</h2>
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

      {selectedDeveloper ? (
        <>
          <div className="mt-5 grid gap-3">
            <Field label={t("targetRoles")} value={formatList(selectedDeveloper.targetRoles, t("unknown"), 3)} />
            <Field label={t("techStack")} value={formatList(selectedDeveloper.availableTechStacks, t("unknown"), 5)} />
            <Field label={t("languageQualifications")} value={formatLanguages(selectedDeveloper, t("unknown"))} />
            <Field label={t("preferredLocation")} value={formatList(selectedDeveloper.preferredLocations, t("unknown"), 2)} />
            <Field
              label={t("preferredSalary")}
              value={formatSalaryValue(
                selectedDeveloper.preferredSalaryMin,
                selectedDeveloper.preferredSalaryMax,
                selectedDeveloper.preferredCurrency,
                t("confirmationNeeded")
              )}
            />
          </div>
          <details className="group mt-4 rounded-lg border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-bold text-slate-800">
              {t("profileDetails")}
              <ChevronDown className="transition group-open:rotate-180" size={18} />
            </summary>
            <div className="grid gap-3 border-t border-slate-200 p-3">
              <Field label={t("resumeSummary")} value={selectedDeveloper.resumeText} />
              <Field label={t("motivation")} value={selectedDeveloper.motivation ?? t("unknown")} />
            </div>
          </details>
        </>
      ) : null}
    </Card>
  );
}

function CompanyRolePanel({
  profiles,
  selectedProfile,
  selectedRoleId,
  debugMode,
  onSelect,
  t
}: {
  profiles: CompanyJobProfile[];
  selectedProfile: CompanyJobProfile | null;
  selectedRoleId: string;
  debugMode: boolean;
  onSelect: (roleId: string) => void;
  t: (key: CopyKey) => string;
}) {
  if (!profiles.length) return <EmptyPanel message={t("noCompanies")} />;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("companyProfile")}</p>
          <h2 className="text-xl font-bold text-slate-950">{selectedProfile?.companyName ?? t("unknown")}</h2>
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

      {selectedProfile ? (
        <>
          <div className="mt-5 grid gap-3">
            <Field label={t("role")} value={selectedProfile.roleTitle} />
            <Field label={t("location")} value={formatRoleLocation(selectedProfile, t).replace(`${t("location")}: `, "")} />
            <Field label={t("techStack")} value={formatList(selectedProfile.requiredTechStacks, t("confirmationNeeded"), 5)} />
            <Field label={t("language")} value={formatRoleLanguages(selectedProfile, t).replace(`${t("language")}: `, "")} />
            <Field label={t("salary")} value={formatRoleSalary(selectedProfile, t).replace(`${t("salary")}: `, "")} />
          </div>

          <details className="group mt-4 rounded-lg border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-bold text-slate-800">
              {t("roleDetails")}
              <ChevronDown className="transition group-open:rotate-180" size={18} />
            </summary>
            <div className="grid gap-3 border-t border-slate-200 p-3">
              <Field label={t("techStack")} value={formatList(selectedProfile.preferredTechStacks, t("unknown"), 6)} />
              {debugMode ? (
                <>
                  <Field label={t("sourceConfidence")} value={humanize(selectedProfile.sourceConfidence)} />
                  <Field label={t("rubricId")} value={selectedProfile.rubricId} />
                  <Field label={t("notes")} value={selectedProfile.notes ?? t("unknown")} />
                </>
              ) : null}
            </div>
          </details>
        </>
      ) : null}
    </Card>
  );
}

function CompanyRankingList({
  results,
  profiles,
  selectedRoleId,
  onSelect,
  t
}: {
  results: DeveloperToCompanyFitResult[];
  profiles: CompanyJobProfile[];
  selectedRoleId: string;
  onSelect: (roleId: string) => void;
  t: (key: CopyKey) => string;
}) {
  const profilesByRoleId = new Map(profiles.map((profile) => [profile.roleId, profile]));

  return (
    <Card className="p-5">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("top10Companies")}</p>
        <h2 className="text-2xl font-bold text-slate-950">{t("bestFitCompanies")}</h2>
      </div>
      <div className="grid gap-3">
        {results.map((result, index) => {
          const profile = profilesByRoleId.get(result.roleId);
          const selected = selectedRoleId === result.roleId;

          return (
            <article
              key={`${result.companyId}-${result.roleId}`}
              className={classNames("rounded-xl border p-4 transition", selected ? "border-green-500 bg-green-50 shadow-sm" : "border-slate-200 bg-white")}
            >
              <div className="grid gap-4 lg:grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1fr)_150px] lg:items-start">
                <div className="text-3xl font-black text-green-700">#{index + 1}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-xl font-bold text-slate-950">{result.companyName}</h3>
                    <Badge tone={fitTone(result.overallFitScore)}>{t(fitLabelKey(result.overallFitScore))}</Badge>
                    <span className="text-xs font-semibold text-slate-500">{t("score")} {clampScore(result.overallFitScore)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{result.roleTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                    <Badge tone="slate">{formatRoleLocation(profile, t)}</Badge>
                    <Badge tone="slate">{formatRoleSalary(profile, t)}</Badge>
                    <Badge tone="slate">{formatRoleLanguages(profile, t)}</Badge>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">{t("whatMatches")}: </span>
                    {result.matchedReasons[0] ?? t("noMatches")}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">{t("whatYouNeedNext")}: </span>
                    {result.missingSignals[0] ?? t("noMissing")}
                  </p>
                  <Badge tone="blue">{t(developerActionKey(result.recommendedNextStep))}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(result.roleId)}
                  className={classNames(
                    "inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold transition",
                    selected ? "bg-green-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {selected ? t("selected") : t("details")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

function MissionCard({ mission, t }: { mission: EvidenceMission; t: (key: CopyKey) => string }) {
  return (
    <article className="rounded-lg border border-green-100 bg-green-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-slate-950">{mission.title}</p>
        <Badge tone="green">{mission.category}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">{mission.reason}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{mission.proofCreated}</p>
    </article>
  );
}

function CompanyDetail({
  result,
  profile,
  t
}: {
  result: DeveloperToCompanyFitResult | null;
  profile: CompanyJobProfile | null;
  t: (key: CopyKey) => string;
}) {
  if (!result) return <EmptyPanel message={t("selectCompanyPrompt")} />;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={fitTone(result.overallFitScore)}>{t(fitLabelKey(result.overallFitScore))}</Badge>
            <Badge tone="blue">{t(developerActionKey(result.recommendedNextStep))}</Badge>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">{result.companyName}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">{result.roleTitle}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("fit")}</p>
          <p className="text-3xl font-black text-green-700">{clampScore(result.overallFitScore)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-950">{t("whatMatches")}</p>
            <ChipList values={result.matchedReasons} tone="green" emptyLabel={t("noMatches")} limit={5} />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-950">{t("whatYouNeedNext")}</p>
            <ChipList values={result.missingSignals} tone="amber" emptyLabel={t("noMissing")} limit={5} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-950">{t("nextStep")}</p>
          <Badge tone="blue">{t(developerActionKey(result.recommendedNextStep))}</Badge>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-950">{t("evidenceMissions")}</p>
          {result.recommendedMissions.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {result.recommendedMissions.slice(0, 4).map((mission) => (
                <MissionCard key={mission.missionId} mission={mission} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t("noMissions")}</p>
          )}
        </div>

        <ScoreAccordion title={t("scoreBreakdown")}>
          {developerScoreRows.map(([key, labelKey]) => (
            <ScoreBar key={key} label={t(labelKey)} value={result.scoreBreakdown[key]} />
          ))}
        </ScoreAccordion>

        {profile ? (
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">{formatRoleLocation(profile, t)}</Badge>
            <Badge tone="slate">{formatRoleSalary(profile, t)}</Badge>
            <Badge tone="slate">{formatRoleLanguages(profile, t)}</Badge>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function CandidateList({
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
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("top10Candidates")}</p>
        <h2 className="text-2xl font-bold text-slate-950">{t("bestFitCandidates")}</h2>
      </div>
      <div className="grid gap-3">
        {results.map((result, index) => {
          const developer = developers.find((item) => item.developerId === result.developerId);
          const signals = deriveKeySignals(result, developer);
          const selected = selectedCandidateId === result.developerId;

          return (
            <article
              key={`${result.roleId}-${result.developerId}`}
              className={classNames("rounded-xl border p-4 transition", selected ? "border-green-500 bg-green-50 shadow-sm" : "border-slate-200 bg-white")}
            >
              <div className="grid gap-4 lg:grid-cols-[64px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_140px] lg:items-center">
                <div className="text-3xl font-black text-green-700">#{index + 1}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{result.developerName}</h3>
                  <p className="text-sm font-semibold text-slate-500">{developer?.nationality ?? t("unknown")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {signals.map((signal) => (
                    <Badge key={`${result.developerId}-${signal}`} tone="slate">
                      {signal}
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Badge tone={fitTone(result.overallFitScore)}>{t(fitLabelKey(result.overallFitScore))}</Badge>
                  <Badge tone="blue">{t(recruiterActionKey(result.recommendedRecruiterAction))}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(result.developerId)}
                  className={classNames(
                    "inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold transition",
                    selected ? "bg-green-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {selected ? t("selected") : t("details")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

function CandidateDetail({
  result,
  developer,
  t
}: {
  result: CompanyToDeveloperFitResult | null;
  developer: DeveloperPreference | undefined;
  t: (key: CopyKey) => string;
}) {
  if (!result) return <EmptyPanel message={t("selectCandidatePrompt")} />;

  const groups = buildStrongPointGroups(result, developer);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("candidateDetail")}</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">{result.developerName}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {developer?.nationality ?? t("unknown")} / {formatList(developer?.targetRoles, t("unknown"), 2)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={fitTone(result.overallFitScore)}>{t(fitLabelKey(result.overallFitScore))}</Badge>
          <Badge tone="blue">{t(recruiterActionKey(result.recommendedRecruiterAction))}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("resumeSummary")} value={developer?.resumeText ?? t("unknown")} wide />
          <Field label={t("motivation")} value={developer?.motivation ?? t("unknown")} wide />
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-950">{t("strongPoints")}</p>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{t(group.key)}</p>
                <ChipList values={group.items} tone="green" emptyLabel={t("unknown")} limit={5} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-950">{t("missingEvidence")}</p>
            <ChipList values={result.missingSignals} tone="amber" emptyLabel={t("noMissing")} limit={6} />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-950">{t("risks")}</p>
            <ChipList values={result.risks} tone="rose" emptyLabel={t("noRisks")} limit={6} />
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">{t("recruiterAction")}</p>
          <p className="mt-1 text-sm text-blue-900">{t(recruiterActionKey(result.recommendedRecruiterAction))}</p>
        </div>

        <ScoreAccordion title={t("scoreBreakdown")}>
          {companyScoreRows.map(([key, labelKey]) => (
            <ScoreBar key={key} label={t(labelKey)} value={result.scoreBreakdown[key]} />
          ))}
        </ScoreAccordion>
      </div>
    </Card>
  );
}

function DebugPanel({
  data,
  selectedDeveloper,
  selectedProfile,
  selectedCompanyResult,
  selectedCandidateResult,
  t
}: {
  data: DashboardData;
  selectedDeveloper: DeveloperPreference | null;
  selectedProfile: CompanyJobProfile | null;
  selectedCompanyResult: DeveloperToCompanyFitResult | null;
  selectedCandidateResult: CompanyToDeveloperFitResult | null;
  t: (key: CopyKey) => string;
}) {
  const jsonBlocks = [
    ["Developer", selectedDeveloper],
    ["Company profile", selectedProfile],
    ["Developer to company result", selectedCompanyResult],
    ["Company to developer result", selectedCandidateResult],
    ["Validation", data.validationSummary]
  ] as const;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t("debugDetails")}</p>
          <h2 className="text-xl font-bold text-slate-950">{t("dataQuality")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("unknownFieldsNote")}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("totalProfiles")} value={data.validationSummary.totalProfiles} />
        <Field label={t("validProfiles")} value={data.validationSummary.validProfiles} />
        <Field label={t("warningProfiles")} value={data.validationSummary.warningProfiles} />
        <Field label={t("invalidProfiles")} value={data.validationSummary.invalidProfiles} />
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-slate-950">{t("commonWarnings")}</p>
        <div className="flex flex-wrap gap-2">
          {data.validationSummary.commonWarnings.slice(0, 8).map((warning) => (
            <Badge key={warning.warning} tone="amber">
              {warning.warning} ({warning.count})
            </Badge>
          ))}
        </div>
      </div>
      <details className="group mt-5 rounded-lg border border-slate-200 bg-slate-950">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-bold text-white">
          <span className="inline-flex items-center gap-2"><FileJson size={16} />{t("rawJson")}</span>
          <ChevronDown className="transition group-open:rotate-180" size={18} />
        </summary>
        <div className="grid gap-3 border-t border-white/10 p-4">
          {jsonBlocks.map(([title, value]) => (
            <section key={title} className="rounded-lg border border-white/10">
              <p className="border-b border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">{title}</p>
              <pre className="max-h-72 overflow-auto p-3 text-xs leading-5 text-slate-200 thin-scrollbar">
                {JSON.stringify(value, null, 2)}
              </pre>
            </section>
          ))}
        </div>
      </details>
    </Card>
  );
}

export function TwoSidedFitDashboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("developerToCompany");
  const [locale, setLocale] = useState<Locale>("ko");
  const [debugMode, setDebugMode] = useState(debugModeDefault);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedCompanyRoleId, setSelectedCompanyRoleId] = useState("");
  const [selectedCompanyMatchRoleId, setSelectedCompanyMatchRoleId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const t = (key: CopyKey) => copy[locale][key] ?? copy.en[key] ?? key;

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
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
        setData({ companyJobProfiles, companyRubrics, companySignals, developerProfiles, metadata, validationSummary });
        setSelectedDeveloperId(developerProfiles[0]?.developerId ?? "");
        setSelectedCompanyRoleId(companyJobProfiles[0]?.roleId ?? "");
        setLoadState("ready");
      } catch (caught) {
        if (!mounted) return;
        setErrorMessage(caught instanceof Error ? caught.message : copy.en.loadFailed);
        setLoadState("error");
      }
    }

    void loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedDeveloper = useMemo(() => {
    if (!data) return null;
    return data.developerProfiles.find((developer) => developer.developerId === selectedDeveloperId) ?? data.developerProfiles[0] ?? null;
  }, [data, selectedDeveloperId]);

  const selectedRoleProfile = useMemo(() => {
    if (!data) return null;
    return data.companyJobProfiles.find((profile) => profile.roleId === selectedCompanyRoleId) ?? data.companyJobProfiles[0] ?? null;
  }, [data, selectedCompanyRoleId]);

  const developerRanking = useMemo(() => {
    if (!data || !selectedDeveloper) return { results: [] as DeveloperToCompanyFitResult[], error: null as string | null };
    try {
      return {
        results: rankCompaniesForDeveloper(selectedDeveloper, data.companyJobProfiles, data.companyRubrics, data.companySignals).slice(0, 10),
        error: null
      };
    } catch {
      return { results: [] as DeveloperToCompanyFitResult[], error: copy.en.rankingFailed };
    }
  }, [data, selectedDeveloper]);

  const candidateRanking = useMemo(() => {
    if (!data || !selectedRoleProfile) return { results: [] as CompanyToDeveloperFitResult[], error: null as string | null };
    try {
      return {
        results: rankDevelopersForCompany(selectedRoleProfile, data.developerProfiles, data.companyRubrics, data.companySignals).slice(0, 10),
        error: null
      };
    } catch {
      return { results: [] as CompanyToDeveloperFitResult[], error: copy.en.rankingFailed };
    }
  }, [data, selectedRoleProfile]);

  useEffect(() => {
    setSelectedCompanyMatchRoleId("");
  }, [selectedDeveloperId]);

  useEffect(() => {
    setSelectedCandidateId("");
  }, [selectedCompanyRoleId]);

  const selectedCompanyResult =
    developerRanking.results.find((result) => result.roleId === selectedCompanyMatchRoleId) ?? null;
  const selectedCompanyProfile =
    data?.companyJobProfiles.find((profile) => profile.roleId === selectedCompanyResult?.roleId) ?? null;
  const selectedCandidateResult =
    candidateRanking.results.find((result) => result.developerId === selectedCandidateId) ?? null;
  const selectedCandidateDeveloper =
    data?.developerProfiles.find((developer) => developer.developerId === selectedCandidateResult?.developerId);

  if (loadState === "loading") return <LoadingPanel />;
  if (loadState === "error" || !data) return <ErrorPanel message={errorMessage || copy.en.loadFailed} />;

  return (
    <main
      className="min-h-screen bg-[#F8FAF7] px-4 py-6 text-slate-900 md:px-8"
      style={{ fontFamily: '"Noto Sans KR", "Noto Sans JP", "Noto Sans", "Inter", system-ui, sans-serif' }}
    >
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
                <Sparkles size={16} />
                BridgePass
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{t("appTitle")}</h1>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
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
            </div>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("developerToCompany")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "developerToCompany" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <BriefcaseBusiness size={18} />
              {t("findCompanies")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("companyToDeveloper")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "companyToDeveloper" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <UsersRound size={18} />
              {t("findCandidates")}
            </button>
          </div>
        </header>

        {activeTab === "developerToCompany" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.5fr)]">
            <DeveloperProfileSummary
              developers={data.developerProfiles}
              selectedDeveloper={selectedDeveloper}
              selectedDeveloperId={selectedDeveloperId}
              onSelect={setSelectedDeveloperId}
              t={t}
            />
            <div className="grid gap-4">
              {developerRanking.error ? (
                <EmptyPanel message={t("rankingFailed")} />
              ) : developerRanking.results.length ? (
                <>
                  <CompanyRankingList
                    results={developerRanking.results}
                    profiles={data.companyJobProfiles}
                    selectedRoleId={selectedCompanyMatchRoleId}
                    onSelect={setSelectedCompanyMatchRoleId}
                    t={t}
                  />
                  <CompanyDetail result={selectedCompanyResult} profile={selectedCompanyProfile} t={t} />
                </>
              ) : (
                <EmptyPanel message={t("noCompanies")} />
              )}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.5fr)]">
            <CompanyRolePanel
              profiles={data.companyJobProfiles}
              selectedProfile={selectedRoleProfile}
              selectedRoleId={selectedCompanyRoleId}
              debugMode={debugMode}
              onSelect={setSelectedCompanyRoleId}
              t={t}
            />
            <div className="grid gap-4">
              {candidateRanking.error ? (
                <EmptyPanel message={t("rankingFailed")} />
              ) : candidateRanking.results.length ? (
                <>
                  <CandidateList
                    results={candidateRanking.results}
                    developers={data.developerProfiles}
                    selectedCandidateId={selectedCandidateId}
                    onSelect={setSelectedCandidateId}
                    t={t}
                  />
                  <CandidateDetail result={selectedCandidateResult} developer={selectedCandidateDeveloper} t={t} />
                </>
              ) : (
                <EmptyPanel message={t("noDevelopers")} />
              )}
            </div>
          </section>
        )}

        {debugMode ? (
          <DebugPanel
            data={data}
            selectedDeveloper={selectedDeveloper}
            selectedProfile={selectedRoleProfile}
            selectedCompanyResult={selectedCompanyResult}
            selectedCandidateResult={selectedCandidateResult}
            t={t}
          />
        ) : null}

        <footer className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={20} />
              <p>{t("safety")}</p>
            </div>
            <button
              type="button"
              onClick={() => setDebugMode((current) => !current)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-200 bg-white/70 px-3 text-xs font-bold text-blue-900"
            >
              {t("debugMode")}: {debugMode ? "on" : "off"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default TwoSidedFitDashboard;
