import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyJobProfilesValidationSummary,
  CompanyToDeveloperFitResult,
  DeveloperPreference,
  DeveloperToCompanyFitResult,
  EvidenceMission
} from "../../shared/companyCriteriaTypes";
import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadSampleDeveloperProfiles
} from "./companyCriteria";

type RubricEvidenceSummary = {
  rubricFit: number;
  evidenceConfidence: number;
  matchedReasons: string[];
  missingSignals: string[];
  risks: string[];
};

type SkillFitSummary = {
  totalScore: number;
  requiredScore: number;
  preferredScore: number;
  matchedRequired: string[];
  matchedPreferred: string[];
  missingRequired: string[];
};

type LanguageFitSummary = {
  score: number;
  matched: string[];
  missing: string[];
};

const techAliases: Record<string, string> = {
  reactjs: "react",
  "react.js": "react",
  react: "react",
  typescript: "ts",
  ts: "ts",
  javascript: "js",
  js: "js",
  "node.js": "node",
  nodejs: "node",
  node: "node",
  "amazon web services": "aws",
  aws: "aws",
  swiftui: "swiftui",
  ios: "ios",
  golang: "go",
  go: "go",
  "react native": "react-native",
  "next.js": "next.js",
  nextjs: "next.js",
  postgres: "postgresql",
  postgresql: "postgresql",
  mlops: "mlops",
  pytorch: "pytorch",
  python: "python",
  firebase: "firebase",
  figma: "figma",
  security: "security",
  siem: "siem"
};

const roleFamilies = {
  frontend: ["frontend", "front-end", "ui", "web"],
  backend: ["backend", "back-end", "api", "server", "platform", "sre", "devops"],
  mobile: ["mobile", "ios", "android", "swiftui", "react native"],
  fullstack: ["fullstack", "full stack"],
  aiml: ["machine learning", "ml", "ai"],
  security: ["security", "cyber"],
  data: ["data", "analytics"]
} as const;

const languageLevelOrder: Record<string, number> = {
  unknown: 0,
  beginner: 1,
  basic: 1,
  n4: 1,
  n5: 1,
  intermediate: 2,
  n3: 2,
  conversational: 2,
  business: 3,
  advanced: 3,
  n2: 3,
  fluent: 4,
  native: 4,
  n1: 4
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeText(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[()/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9가-힣一-龥ぁ-んァ-ン]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );
}

function matchesPhrase(text: string, tokens: Set<string>, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  if (text.includes(normalizedPhrase)) return true;
  const phraseTokens = [...tokenize(normalizedPhrase)];
  if (!phraseTokens.length) return false;
  return phraseTokens.every((token) => tokens.has(token));
}

function normalizeTech(value: string): string {
  const normalized = normalizeText(value);
  return techAliases[normalized] ?? normalized;
}

function normalizeTechSet(values: string[]): Set<string> {
  return new Set(values.map(normalizeTech).filter(Boolean));
}

function normalizeLanguage(value: string): string {
  const normalized = normalizeText(value);
  if (normalized.includes("japanese")) return "japanese";
  if (normalized.includes("korean")) return "korean";
  if (normalized.includes("english")) return "english";
  return normalized || "other";
}

function languageLevelScore(level: string): number {
  const normalized = normalizeText(level);
  if (normalized.includes("n1")) return 4;
  if (normalized.includes("n2") || normalized.includes("business")) return 3;
  if (normalized.includes("n3") || normalized.includes("intermediate")) return 2;
  if (normalized.includes("beginner") || normalized.includes("n4") || normalized.includes("n5")) return 1;
  return languageLevelOrder[normalized] ?? 0;
}

function roleFamiliesFromText(value: string): string[] {
  const text = normalizeText(value);
  const matches = Object.entries(roleFamilies)
    .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
    .map(([family]) => family);

  if (matches.length) return matches;
  if (text.includes("software engineer")) return ["backend", "fullstack"];
  return ["other"];
}

function partialRoleMatchScore(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const overlap = [...leftSet].filter((value) => rightSet.has(value));
  if (overlap.length) return 100;

  const partialPairs = [
    ["frontend", "fullstack"],
    ["mobile", "frontend"],
    ["backend", "fullstack"],
    ["backend", "data"],
    ["aiml", "data"]
  ];

  for (const [a, b] of partialPairs) {
    if ((leftSet.has(a) && rightSet.has(b)) || (leftSet.has(b) && rightSet.has(a))) {
      return 75;
    }
  }

  return 35;
}

function buildDeveloperText(developer: DeveloperPreference): string {
  return [
    developer.resumeText,
    developer.portfolioText,
    developer.motivation,
    developer.concerns?.join(" "),
    developer.availableTechStacks.join(" "),
    developer.targetRoles.join(" "),
    developer.preferredCompanyTypes.join(" "),
    developer.languageCertifications.map((item) => `${item.language} ${item.level} ${item.certification ?? ""}`).join(" ")
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function findRubric(companyJobProfile: CompanyJobProfile, companyRubrics: CompanyEvaluationRubric[]): CompanyEvaluationRubric | null {
  return companyRubrics.find((item) => item.companyId === companyJobProfile.rubricId || item.companyId === companyJobProfile.companyId) ?? null;
}

function findSignal(companyId: string, companySignals: CompanyHiringSignal[]): CompanyHiringSignal | null {
  return companySignals.find((item) => item.companyId === companyId) ?? null;
}

function calculateSkillFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): SkillFitSummary {
  const developerTech = normalizeTechSet(developer.availableTechStacks);
  const required = [...normalizeTechSet(companyJobProfile.requiredTechStacks)];
  const preferred = [...normalizeTechSet(companyJobProfile.preferredTechStacks)].filter((item) => !required.includes(item));

  const matchedRequired = required.filter((item) => developerTech.has(item));
  const matchedPreferred = preferred.filter((item) => developerTech.has(item));
  const missingRequired = required.filter((item) => !developerTech.has(item));

  if (!required.length && !preferred.length) {
    return {
      totalScore: 60,
      requiredScore: 60,
      preferredScore: 60,
      matchedRequired,
      matchedPreferred,
      missingRequired
    };
  }

  const requiredCoverage = required.length ? matchedRequired.length / required.length : 0.7;
  const preferredCoverage = preferred.length ? matchedPreferred.length / preferred.length : 0.6;
  let totalScore = requiredCoverage * 75 + preferredCoverage * 25;

  if (required.length > 0 && matchedRequired.length === 0) {
    totalScore = Math.min(totalScore, 40);
  }

  return {
    totalScore: round(clamp(totalScore, 0, 100)),
    requiredScore: round(clamp(requiredCoverage * 100, 0, 100)),
    preferredScore: round(clamp(preferredCoverage * 100, 0, 100)),
    matchedRequired,
    matchedPreferred,
    missingRequired
  };
}

function calculateRoleFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): { score: number; matchedReasons: string[] } {
  const developerRoleFamilies = unique(developer.targetRoles.flatMap(roleFamiliesFromText));
  const companyRoleFamilies = unique([
    ...roleFamiliesFromText(companyJobProfile.roleTitle),
    ...roleFamiliesFromText(companyJobProfile.roleCategory)
  ]);
  const score = partialRoleMatchScore(developerRoleFamilies, companyRoleFamilies);
  const matchedReasons = score >= 75
    ? [`목표 역할이 ${companyJobProfile.roleTitle} 와 직접 또는 부분적으로 맞습니다.`]
    : [`목표 역할과 ${companyJobProfile.roleTitle} 사이에 일부 전환 가능성이 있습니다.`];
  return { score, matchedReasons };
}

function calculateSalaryFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): number {
  if (
    typeof companyJobProfile.salaryMin !== "number" ||
    typeof companyJobProfile.salaryMax !== "number" ||
    companyJobProfile.salaryCurrency === "unknown"
  ) {
    return 60;
  }

  if (
    typeof developer.preferredSalaryMin !== "number" ||
    typeof developer.preferredSalaryMax !== "number" ||
    developer.preferredCurrency !== companyJobProfile.salaryCurrency
  ) {
    return 60;
  }

  const overlap = developer.preferredSalaryMin <= companyJobProfile.salaryMax && developer.preferredSalaryMax >= companyJobProfile.salaryMin;
  if (overlap) return 92;

  const aboveRatio = developer.preferredSalaryMin / companyJobProfile.salaryMax;
  if (aboveRatio <= 1.1) return 68;
  if (aboveRatio <= 1.25) return 52;
  return 28;
}

function calculateLocationFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): number {
  if (!companyJobProfile.locations.length || companyJobProfile.locations.includes("unknown")) {
    return 60;
  }

  const developerLocations = new Set(developer.preferredLocations.map(normalizeText));
  const companyLocations = companyJobProfile.locations.map(normalizeText);
  const directMatch = companyLocations.some((location) => developerLocations.has(location));
  if (directMatch) return 95;

  if (companyJobProfile.workStyle === "remote" && ["remote", "hybrid", "any"].includes(developer.workStylePreference)) {
    return 88;
  }

  if (companyJobProfile.workStyle === "hybrid" && ["hybrid", "onsite", "any"].includes(developer.workStylePreference)) {
    return developer.relocationAvailable ? 78 : 68;
  }

  if (developer.relocationAvailable) return 70;
  return 42;
}

function calculateLanguageFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile, signal: CompanyHiringSignal | null): LanguageFitSummary {
  const developerLanguages = new Map<string, number>(
    developer.languageCertifications.map((item) => [normalizeLanguage(item.language), languageLevelScore(item.level)])
  );
  const required = companyJobProfile.requiredLanguages;
  const preferred = companyJobProfile.preferredLanguages ?? [];

  if (!required.length && !preferred.length) {
    const englishLevel = developerLanguages.get("english") ?? 0;
    const japaneseLevel = developerLanguages.get("japanese") ?? 0;
    if ((signal?.workStyle ?? []).includes("GlobalTeam") && englishLevel >= 2) {
      return { score: 72, matched: ["Global team communication potential"], missing: [] };
    }
    if (companyJobProfile.country === "Japan" && japaneseLevel >= 2) {
      return { score: 70, matched: ["일본 업무 환경 적응 가능성"], missing: [] };
    }
    return { score: 60, matched: [], missing: ["명시적 언어 요구사항이 없어 확인 필요"] };
  }

  const matched: string[] = [];
  const missing: string[] = [];
  const scores = required.map((requirement) => {
    const developerLevel = developerLanguages.get(normalizeLanguage(requirement.language)) ?? 0;
    const requiredLevel = languageLevelScore(requirement.level);
    if (developerLevel >= requiredLevel) {
      matched.push(`${requirement.language} ${requirement.level}`);
      return 100;
    }
    if (developerLevel === requiredLevel - 1 && developerLevel > 0) {
      missing.push(`${requirement.language} ${requirement.level} 에 근접하지만 추가 증빙 필요`);
      return 65;
    }
    missing.push(`${requirement.language} ${requirement.level}`);
    return 30;
  });

  const preferredScore = preferred.length
    ? preferred.reduce((sum, requirement) => {
        const developerLevel = developerLanguages.get(normalizeLanguage(requirement.language)) ?? 0;
        const requiredLevel = languageLevelScore(requirement.level);
        return sum + (developerLevel >= requiredLevel ? 100 : developerLevel > 0 ? 65 : 40);
      }, 0) / preferred.length
    : 70;

  const score = scores.length ? scores.reduce((sum, item) => sum + item, 0) / scores.length : 60;
  return { score: round(score * 0.8 + preferredScore * 0.2), matched, missing };
}

function calculateExperienceFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): number {
  const { minYears, maxYears } = companyJobProfile.experienceRange;
  if (typeof minYears !== "number" && typeof maxYears !== "number") return 65;
  if (typeof minYears === "number" && developer.yearsOfExperience < minYears) {
    const gap = minYears - developer.yearsOfExperience;
    return gap <= 1 ? 72 : gap <= 2 ? 54 : 35;
  }
  if (typeof maxYears === "number" && developer.yearsOfExperience > maxYears) {
    const gap = developer.yearsOfExperience - maxYears;
    return gap <= 1 ? 82 : gap <= 3 ? 68 : 58;
  }
  return 92;
}

function calculateWorkStyleFit(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile): number {
  if (developer.workStylePreference === "any") return 90;
  if (companyJobProfile.workStyle === "unknown") return 60;
  if (developer.workStylePreference === companyJobProfile.workStyle) return 100;
  if (
    (developer.workStylePreference === "remote" && companyJobProfile.workStyle === "hybrid") ||
    (developer.workStylePreference === "hybrid" && companyJobProfile.workStyle === "remote")
  ) {
    return 78;
  }
  if (developer.workStylePreference === "onsite" && companyJobProfile.workStyle === "hybrid") return 75;
  return 35;
}

function calculateMotivationMatch(developer: DeveloperPreference, companyJobProfile: CompanyJobProfile, signal: CompanyHiringSignal | null): number {
  const motivation = normalizeText(developer.motivation ?? "");
  if (!motivation) return 45;

  const companyKeywords = [companyJobProfile.companyType, companyJobProfile.companyName, ...(signal?.companyValues ?? [])]
    .map(normalizeText)
    .filter(Boolean);

  const directMatches = companyKeywords.filter((keyword) => keyword && motivation.includes(keyword));
  if (directMatches.length >= 2) return 92;
  if (directMatches.length === 1) return 78;
  if (/japan|일본|global|ユーザー|user|product|제품|협업|collaboration/.test(motivation)) return 68;
  return 55;
}

function evaluateRubricEvidence(
  developer: DeveloperPreference,
  rubric: CompanyEvaluationRubric | null,
  signal: CompanyHiringSignal | null
): RubricEvidenceSummary {
  if (!rubric) {
    return {
      rubricFit: 60,
      evidenceConfidence: 50,
      matchedReasons: [],
      missingSignals: ["회사 rubric 연결이 없어 추가 검증 필요"],
      risks: []
    };
  }

  const developerText = buildDeveloperText(developer);
  const developerTokens = tokenize(developerText);
  const matchedReasons = unique(
    rubric.criteria.flatMap((criterion) =>
      criterion.positiveEvidence
        .filter((evidence) => matchesPhrase(developerText, developerTokens, evidence))
        .map((evidence) => `${criterion.criterionName}: ${evidence}`)
    )
  );
  const missingSignals = unique(
    rubric.criteria.flatMap((criterion) =>
      criterion.positiveEvidence
        .filter((evidence) => !matchesPhrase(developerText, developerTokens, evidence))
        .map((evidence) => `${criterion.criterionName}: ${evidence}`)
    )
  );
  const risks = unique(
    rubric.criteria.flatMap((criterion) =>
      criterion.riskSignals
        .filter((riskSignal) => matchesPhrase(developerText, developerTokens, riskSignal))
        .map((riskSignal) => `${criterion.criterionName}: ${riskSignal}`)
    )
  );

  const criterionScores = rubric.criteria.map((criterion) => {
    const matched = criterion.positiveEvidence.filter((evidence) => matchesPhrase(developerText, developerTokens, evidence));
    const matchedRisks = criterion.riskSignals.filter((riskSignal) => matchesPhrase(developerText, developerTokens, riskSignal));
    let score = 50 + Math.min(matched.length * 10, 35) - Math.min(matchedRisks.length * 10, 30);
    if ((developer.resumeText + (developer.portfolioText ?? "")).trim().length < 120) {
      score = Math.min(score, 62);
    }
    return clamp(score, 0, 100) * criterion.weight / 100;
  });

  const signalMatches = unique((signal?.evaluationSignals ?? []).filter((item) => matchesPhrase(developerText, developerTokens, item)));
  const signalMissing = unique((signal?.recommendedCandidateEvidence ?? []).filter((item) => !matchesPhrase(developerText, developerTokens, item)));
  const allPositiveCount = rubric.criteria.reduce((sum, criterion) => sum + criterion.positiveEvidence.length, 0);
  const coverage = allPositiveCount ? matchedReasons.length / allPositiveCount : 0.5;
  const evidenceConfidence = round(
    clamp(coverage * 75 + signalMatches.length * 8 + (developer.portfolioText ? 8 : 0) + (developer.motivation ? 6 : 0), 0, 100)
  );

  return {
    rubricFit: round(clamp(criterionScores.reduce((sum, score) => sum + score, 0), 0, 100)),
    evidenceConfidence,
    matchedReasons: unique([...matchedReasons, ...signalMatches]).slice(0, 8),
    missingSignals: unique([...missingSignals, ...signalMissing]).slice(0, 10),
    risks: unique([...risks, ...(signal?.riskConcerns ?? []).filter((item) => matchesPhrase(developerText, developerTokens, item))]).slice(0, 8)
  };
}

function missionForPattern(patternKey: string, companyJobProfile: CompanyJobProfile): EvidenceMission {
  const recommendedFor = [companyJobProfile.companyName, companyJobProfile.roleTitle];
  const catalog: Record<string, Omit<EvidenceMission, "missionId" | "recommendedFor">> = {
    japanese_bug_report: {
      title: "Japanese Bug Report Practice",
      category: "language",
      reason: "일본어 업무 보고나 버그 설명 근거가 부족합니다.",
      expectedOutcome: "일본어로 이슈를 구조적으로 설명하는 업무 커뮤니케이션 증빙을 만듭니다.",
      proofCreated: "Japanese Work Reporting — AI-assessed"
    },
    japanese_requirement_clarification: {
      title: "Japanese Requirement Clarification Practice",
      category: "communication",
      reason: "요구사항 확인, 모호성 해소, 질문 설계 증빙이 부족합니다.",
      expectedOutcome: "일본어/영어 혼합 환경에서 요구사항을 정리하는 실무형 응답을 만듭니다.",
      proofCreated: "Requirement Clarification — AI-assessed"
    },
    korea_japan_frontend_project: {
      title: "Korea-Japan Frontend Mini Project",
      category: "portfolio",
      reason: "사용자-facing 제품 증빙이나 협업 포트폴리오가 약합니다.",
      expectedOutcome: "한일 사용자 시나리오를 반영한 작지만 검증 가능한 제품 결과물을 만듭니다.",
      proofCreated: "Cross-border Collaboration — Project-verified"
    },
    b2b_company_research: {
      title: "B2B SaaS Company Research",
      category: "motivation",
      reason: "회사 이해도와 지원 동기 구체성이 부족합니다.",
      expectedOutcome: "회사 도메인, 고객, 제품, 팀 운영 방식을 구조화해 이해도를 증명합니다.",
      proofCreated: "Company Understanding — Self-documented / AI-reviewed"
    },
    recruiter_lens_rewrite: {
      title: "Recruiter Lens Motivation Rewrite",
      category: "motivation",
      reason: "지원 동기를 회사/역할 기준으로 다시 정리할 필요가 있습니다.",
      expectedOutcome: "회사-specific 동기와 기여 가설을 더 명확한 문장으로 정리합니다.",
      proofCreated: "Company-specific Motivation — AI-refactored"
    },
    github_collaboration_review: {
      title: "GitHub Collaboration Review",
      category: "collaboration",
      reason: "협업 방식과 코드 리뷰 흔적을 보여주는 증빙이 부족합니다.",
      expectedOutcome: "pull request, review comment, issue discussion 기반 협업 근거를 정리합니다.",
      proofCreated: "GitHub Collaboration Evidence — Project-reviewed"
    },
    technical_proof_sprint: {
      title: "Role-specific Technical Proof Sprint",
      category: "technical",
      reason: "핵심 기술 스택 또는 역할 관련 실무 증빙이 부족합니다.",
      expectedOutcome: "해당 역할에 가까운 작은 구현 또는 리팩터링 결과를 포트폴리오로 남깁니다.",
      proofCreated: "Technical Proof — Project-verified"
    }
  };

  const mission = catalog[patternKey] ?? catalog.technical_proof_sprint;
  return {
    missionId: `${companyJobProfile.roleId}-${patternKey}`,
    ...mission,
    recommendedFor
  };
}

export function getRecommendedEvidenceMissions(
  missingSignals: string[],
  risks: string[],
  companyJobProfile: CompanyJobProfile
): EvidenceMission[] {
  const joined = normalizeText([...missingSignals, ...risks, companyJobProfile.notes ?? ""].join(" "));
  const missionKeys = new Set<string>();

  if (/japanese|일본어|business/.test(joined)) missionKeys.add("japanese_bug_report");
  if (/ambiguity|clarification|requirement|communication|질문|요구사항/.test(joined)) missionKeys.add("japanese_requirement_clarification");
  if (/github|collaboration|crossfunctional|cross functional|review/.test(joined)) missionKeys.add("github_collaboration_review");
  if (/motivation|missionalignment|company understanding|동기|회사 이해|research/.test(joined)) missionKeys.add("recruiter_lens_rewrite");
  if (/b2b|saas|marketplace|fintech|hr saas/.test(joined)) missionKeys.add("b2b_company_research");
  if (/portfolio|productdelivery|frontend|mobile|swiftui|react|ui/.test(joined) || ["Frontend", "Mobile", "Fullstack"].includes(companyJobProfile.roleCategory)) {
    missionKeys.add("korea_japan_frontend_project");
  }
  if (/technical|go|aws|python|ml|backend|security/.test(joined) || missingSignals.length > 0) {
    missionKeys.add("technical_proof_sprint");
  }

  if (!missionKeys.size) {
    missionKeys.add("technical_proof_sprint");
  }

  return [...missionKeys].map((missionKey) => missionForPattern(missionKey, companyJobProfile)).slice(0, 6);
}

function getDeveloperNextStep(overallFitScore: number, evidenceConfidence: number, risks: string[], missions: EvidenceMission[]): DeveloperToCompanyFitResult["recommendedNextStep"] {
  if (overallFitScore >= 85 && evidenceConfidence >= 72 && risks.length <= 1) return "apply_now";
  if (overallFitScore >= 78 && evidenceConfidence >= 62) return "casual_interview";
  if (overallFitScore >= 68) return "trial_project";
  if (missions.some((mission) => mission.category === "motivation")) return "rewrite_motivation";
  if (missions.some((mission) => mission.title.includes("Research"))) return "research_company";
  return "bridge_labs_activity";
}

function getRecruiterAction(overallFitScore: number, evidenceConfidence: number, missingSignals: string[], risks: string[]): CompanyToDeveloperFitResult["recommendedRecruiterAction"] {
  if (overallFitScore >= 86 && evidenceConfidence >= 72 && risks.length <= 1) return "casual_interview";
  if (overallFitScore >= 78 && missingSignals.length <= 3) return "trial_project";
  if (overallFitScore >= 72) return "request_passport";
  if (overallFitScore >= 64) return "invite_office_tour";
  if (evidenceConfidence >= 58) return "save_candidate";
  return "recommend_bridge_labs";
}

export function explainDeveloperCompanyFit(result: DeveloperToCompanyFitResult): string {
  const strengths = result.matchedReasons.slice(0, 2).join(", ") || "직접적인 강점 근거가 아직 부족합니다";
  const missing = result.missingSignals.slice(0, 2).join(", ") || "큰 누락 신호는 없습니다";
  return `${result.companyName} ${result.roleTitle} 기준으로 보면, 이 개발자는 ${strengths} 측면에서 fit 이 있습니다. 다만 ${missing} 항목은 추가 증빙이 필요하며, 다음 액션은 ${result.recommendedNextStep} 입니다.`;
}

export function explainCompanyCandidateFit(result: CompanyToDeveloperFitResult): string {
  const strengths = result.topMatchSignals.slice(0, 2).join(", ") || "보수적으로 검토할 만한 기본 근거";
  const missing = result.missingSignals.slice(0, 2).join(", ") || "추가 확인 필요 항목이 제한적입니다";
  return `${result.developerName} 후보는 ${strengths} 이유로 우선 접촉 가치가 있습니다. 다만 ${missing} 부분은 검증이 필요하며, 추천 recruiter action 은 ${result.recommendedRecruiterAction} 입니다.`;
}

export function validateCompanyJobProfiles(
  profiles: CompanyJobProfile[],
  companyRubrics: CompanyEvaluationRubric[] = []
): CompanyJobProfilesValidationSummary {
  const rubricIds = new Set(companyRubrics.map((rubric) => rubric.companyId));
  const warningsByCompany = profiles.flatMap((profile) => {
    const warnings: string[] = [];
    if (!profile.roleTitle.trim()) warnings.push("missing role title");
    if (!profile.requiredTechStacks.length && !profile.preferredTechStacks.length) warnings.push("missing tech stack");
    if (typeof profile.salaryMin !== "number" || typeof profile.salaryMax !== "number") warnings.push("missing salary");
    if (!profile.locations.length || profile.locations.includes("unknown")) warnings.push("missing location");
    if (!profile.requiredLanguages.length) warnings.push("missing language requirement");
    if (typeof profile.experienceRange.minYears !== "number" && typeof profile.experienceRange.maxYears !== "number") {
      warnings.push("missing experience range");
    }
    if (profile.sourceConfidence === "fallback") warnings.push("fallback source");
    if (profile.sourceConfidence === "low") warnings.push("low source confidence");
    if (companyRubrics.length > 0 && !rubricIds.has(profile.rubricId)) warnings.push("no matching rubricId");
    if (!warnings.length) return [];
    return [{ companyId: profile.companyId, companyName: profile.companyName, roleId: profile.roleId, warnings }];
  });

  const invalidProfiles = profiles.filter((profile) => !profile.companyId || !profile.companyName || !profile.roleId || !profile.roleTitle).length;
  const warningProfiles = warningsByCompany.filter((item) => item.warnings.length > 0).length - invalidProfiles;
  const validProfiles = profiles.length - invalidProfiles - warningProfiles;

  return {
    totalProfiles: profiles.length,
    validProfiles,
    warningProfiles,
    invalidProfiles,
    warningsByCompany
  };
}

export function rankCompaniesForDeveloper(
  developer: DeveloperPreference,
  companyJobProfiles: CompanyJobProfile[],
  companyRubrics: CompanyEvaluationRubric[],
  companySignals: CompanyHiringSignal[] = []
): DeveloperToCompanyFitResult[] {
  return companyJobProfiles
    .map((companyJobProfile) => {
      const rubric = findRubric(companyJobProfile, companyRubrics);
      const signal = findSignal(companyJobProfile.companyId, companySignals);
      const skillFit = calculateSkillFit(developer, companyJobProfile);
      const roleFit = calculateRoleFit(developer, companyJobProfile);
      const salaryFit = calculateSalaryFit(developer, companyJobProfile);
      const locationFit = calculateLocationFit(developer, companyJobProfile);
      const languageFit = calculateLanguageFit(developer, companyJobProfile, signal);
      const experienceFit = calculateExperienceFit(developer, companyJobProfile);
      const workStyleFit = calculateWorkStyleFit(developer, companyJobProfile);
      const rubricEvidence = evaluateRubricEvidence(developer, rubric, signal);
      const overallFitScore = round(
        skillFit.totalScore * 0.2 +
          roleFit.score * 0.15 +
          salaryFit * 0.1 +
          locationFit * 0.1 +
          languageFit.score * 0.15 +
          experienceFit * 0.1 +
          workStyleFit * 0.1 +
          rubricEvidence.rubricFit * 0.1
      );

      const matchedReasons = unique([
        ...skillFit.matchedRequired.map((item) => `필수 기술 일치: ${item}`),
        ...skillFit.matchedPreferred.map((item) => `선호 기술 일치: ${item}`),
        ...roleFit.matchedReasons,
        ...languageFit.matched.map((item) => `언어 근거: ${item}`),
        ...rubricEvidence.matchedReasons,
        developer.preferredCompanyTypes.includes(companyJobProfile.companyType)
          ? `선호 회사 유형(${companyJobProfile.companyType}) 과 맞습니다.`
          : ""
      ]).slice(0, 10);

      const missingSignals = unique([
        ...skillFit.missingRequired.map((item) => `필수 기술 보강 필요: ${item}`),
        ...languageFit.missing,
        ...rubricEvidence.missingSignals
      ]).slice(0, 12);

      const risks = unique([
        developer.visaSupportNeeded && companyJobProfile.country === "Japan" ? "비자 지원 여부 확인 필요" : "",
        ...rubricEvidence.risks,
        companyJobProfile.sourceConfidence === "fallback" ? "공고 데이터 신뢰도가 fallback 수준입니다." : ""
      ]).slice(0, 8);

      const recommendedMissions = getRecommendedEvidenceMissions(missingSignals, risks, companyJobProfile);
      const recommendedNextStep = getDeveloperNextStep(
        overallFitScore,
        rubricEvidence.evidenceConfidence,
        risks,
        recommendedMissions
      );

      const result: DeveloperToCompanyFitResult = {
        developerId: developer.developerId,
        companyId: companyJobProfile.companyId,
        companyName: companyJobProfile.companyName,
        roleId: companyJobProfile.roleId,
        roleTitle: companyJobProfile.roleTitle,
        overallFitScore,
        scoreBreakdown: {
          skillFit: skillFit.totalScore,
          roleFit: roleFit.score,
          salaryFit,
          locationFit,
          languageFit: languageFit.score,
          experienceFit,
          workStyleFit,
          rubricFit: rubricEvidence.rubricFit,
          evidenceConfidence: rubricEvidence.evidenceConfidence
        },
        matchedReasons,
        missingSignals,
        risks,
        recommendedMissions,
        recommendedNextStep,
        explanation: ""
      };

      return { ...result, explanation: explainDeveloperCompanyFit(result) };
    })
    .sort((left, right) => right.overallFitScore - left.overallFitScore);
}

export function rankDevelopersForCompany(
  companyJobProfile: CompanyJobProfile,
  developerProfiles: DeveloperPreference[],
  companyRubrics: CompanyEvaluationRubric[],
  companySignals: CompanyHiringSignal[] = []
): CompanyToDeveloperFitResult[] {
  return developerProfiles
    .map((developer) => {
      const rubric = findRubric(companyJobProfile, companyRubrics);
      const signal = findSignal(companyJobProfile.companyId, companySignals);
      const skillFit = calculateSkillFit(developer, companyJobProfile);
      const languageFit = calculateLanguageFit(developer, companyJobProfile, signal);
      const experienceFit = calculateExperienceFit(developer, companyJobProfile);
      const locationWorkstyleMatch = round((calculateLocationFit(developer, companyJobProfile) + calculateWorkStyleFit(developer, companyJobProfile)) / 2);
      const motivationMatch = calculateMotivationMatch(developer, companyJobProfile, signal);
      const rubricEvidence = evaluateRubricEvidence(developer, rubric, signal);

      const overallFitScore = round(
        skillFit.requiredScore * 0.25 +
          skillFit.preferredScore * 0.15 +
          languageFit.score * 0.15 +
          experienceFit * 0.15 +
          locationWorkstyleMatch * 0.1 +
          motivationMatch * 0.1 +
          rubricEvidence.evidenceConfidence * 0.1
      );

      const topMatchSignals = unique([
        ...skillFit.matchedRequired.map((item) => `required skill: ${item}`),
        ...skillFit.matchedPreferred.map((item) => `preferred skill: ${item}`),
        ...languageFit.matched.map((item) => `language: ${item}`),
        ...rubricEvidence.matchedReasons
      ]).slice(0, 10);

      const missingSignals = unique([
        ...skillFit.missingRequired.map((item) => `missing required skill: ${item}`),
        ...languageFit.missing,
        ...rubricEvidence.missingSignals
      ]).slice(0, 10);

      const risks = unique([
        developer.visaSupportNeeded && companyJobProfile.country === "Japan" ? "visa support needs verification" : "",
        ...rubricEvidence.risks,
        developer.concerns?.length ? `candidate concerns noted: ${developer.concerns[0]}` : ""
      ]).slice(0, 8);

      const recommendedRecruiterAction = getRecruiterAction(
        overallFitScore,
        rubricEvidence.evidenceConfidence,
        missingSignals,
        risks
      );

      const result: CompanyToDeveloperFitResult = {
        companyId: companyJobProfile.companyId,
        companyName: companyJobProfile.companyName,
        roleId: companyJobProfile.roleId,
        roleTitle: companyJobProfile.roleTitle,
        developerId: developer.developerId,
        developerName: developer.name,
        overallFitScore,
        scoreBreakdown: {
          requiredSkillMatch: skillFit.requiredScore,
          preferredSkillMatch: skillFit.preferredScore,
          languageRequirementMatch: languageFit.score,
          experienceLevelMatch: experienceFit,
          locationWorkstyleMatch,
          motivationMatch,
          rubricFit: rubricEvidence.rubricFit,
          evidenceConfidence: rubricEvidence.evidenceConfidence
        },
        topMatchSignals,
        missingSignals,
        risks,
        recommendedRecruiterAction,
        explanation: ""
      };

      return { ...result, explanation: explainCompanyCandidateFit(result) };
    })
    .sort((left, right) => right.overallFitScore - left.overallFitScore);
}

export async function loadAndRunTwoSidedFitExample(developerId?: string) {
  const [companyJobProfiles, companyRubrics, companySignals, developerProfiles] = await Promise.all([
    loadCompanyJobProfiles(),
    loadCompanyRubrics(),
    loadCompanySignals(),
    loadSampleDeveloperProfiles()
  ]);

  const selectedDeveloper = developerProfiles.find((developer) => developer.developerId === developerId) ?? developerProfiles[0];
  const rankedCompanies = rankCompaniesForDeveloper(selectedDeveloper, companyJobProfiles, companyRubrics, companySignals);
  const validationSummary = validateCompanyJobProfiles(companyJobProfiles, companyRubrics);

  return {
    developer: selectedDeveloper,
    topCompanies: rankedCompanies.slice(0, 5),
    validationSummary
  };
}