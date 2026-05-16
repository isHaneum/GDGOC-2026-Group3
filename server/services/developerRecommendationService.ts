import companyJobProfiles from "../../public/data/company-criteria/companyJobProfiles.json";
import companyRubrics from "../../public/data/company-criteria/companyRubrics.json";
import companySignals from "../../public/data/company-criteria/companySignals.json";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyRubricCriterion,
  DeveloperLanguageCertification,
  DeveloperPreference,
} from "../../shared/companyCriteriaTypes";
import type { EmployeeRecommendationsResponse } from "../../shared/employeeRecommendations";
import type { CvContent, DeveloperProfileFull } from "../../shared/types";
import { mergeCompanySalaryDataList } from "../../src/lib/companySalaryEnrichment";
import { rankCompaniesForDeveloper } from "../../src/lib/twoSidedFitEngine";

type RawRubricCriterion = Omit<CompanyRubricCriterion, "recommendedVerificationActivity"> & {
  recommendedVerificationActivity: string | string[];
};

type RawCompanyEvaluationRubric = Omit<CompanyEvaluationRubric, "criteria"> & {
  criteria: RawRubricCriterion[];
};

function sanitizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeNationality(value?: string | null): DeveloperPreference["nationality"] {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized.includes("korean") || normalized.includes("korea") || normalized.includes("한국")) return "Korean";
  if (normalized.includes("japanese") || normalized.includes("japan") || normalized.includes("일본") || normalized.includes("日本")) return "Japanese";
  return "Other";
}

function normalizeCurrency(value?: string | null): DeveloperPreference["preferredCurrency"] {
  if (value === "KRW" || value === "USD") return value;
  return "JPY";
}

function normalizeWorkStyle(value?: string | null): DeveloperPreference["workStylePreference"] {
  if (value === "remote" || value === "hybrid" || value === "onsite") return value;
  return "any";
}

function normalizeLanguageCertifications(
  values?: DeveloperLanguageCertification[] | null
): DeveloperPreference["languageCertifications"] {
  return (values ?? []).map((item) => ({
    language: item.language === "Japanese" || item.language === "Korean" || item.language === "English" ? item.language : "Other",
    level: item.level,
    certification: item.certification,
  }));
}

function parseYearsOfExperience(...texts: Array<string | undefined>): number {
  for (const text of texts) {
    if (!text) continue;
    const match = text.match(/(\d+)\s*(?:년|years?)/i);
    if (match) return Number(match[1]);
  }

  return 0;
}

function buildCvText(contents: CvContent[] | null | undefined): string {
  return (contents ?? [])
    .map((item) => {
      const name = sanitizeString(item.name);
      const content = sanitizeString(item.content);
      if (!content) return "";
      return name ? `${name}: ${content}` : content;
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeRubrics(rubrics: RawCompanyEvaluationRubric[]): CompanyEvaluationRubric[] {
  return rubrics.map((rubric) => ({
    ...rubric,
    criteria: rubric.criteria.map((criterion) => ({
      ...criterion,
      recommendedVerificationActivity: Array.isArray(criterion.recommendedVerificationActivity)
        ? criterion.recommendedVerificationActivity
        : [criterion.recommendedVerificationActivity],
    })),
  }));
}

export function mapDeveloperProfileFullToPreference(record: DeveloperProfileFull): DeveloperPreference {
  const { profile, devProfile, cv } = record;
  const cvText = buildCvText(cv?.contents);
  const techStack = (devProfile.tech_stack ?? []).filter(Boolean);
  const targetRoles = (devProfile.target_roles?.length ? devProfile.target_roles : [devProfile.target_role]).filter(Boolean) as string[];
  const projectExperience = sanitizeString(devProfile.key_project_experience);
  const selfIntroduction = sanitizeString(devProfile.self_introduction);
  const motivation = sanitizeString(devProfile.motivation);

  return {
    developerId: String(profile.user_id ?? profile.id),
    name: sanitizeString(devProfile.full_name) ?? "지원자",
    nationality: normalizeNationality(devProfile.nationality),
    preferredSalaryMin: typeof devProfile.preferred_salary_min === "number" ? devProfile.preferred_salary_min : undefined,
    preferredSalaryMax: typeof devProfile.preferred_salary_max === "number" ? devProfile.preferred_salary_max : undefined,
    preferredCurrency: normalizeCurrency(devProfile.preferred_currency),
    preferredLocations: (devProfile.preferred_locations ?? []).filter(Boolean),
    availableTechStacks: techStack,
    languageCertifications: normalizeLanguageCertifications(devProfile.language_certifications),
    yearsOfExperience:
      typeof devProfile.years_of_experience === "number"
        ? devProfile.years_of_experience
        : parseYearsOfExperience(projectExperience, cvText),
    targetRoles: targetRoles.length ? targetRoles : ["Software Engineer"],
    preferredCompanyTypes: (devProfile.preferred_company_types ?? []).filter(Boolean),
    workStylePreference: normalizeWorkStyle(devProfile.work_style_preference),
    relocationAvailable: Boolean(devProfile.relocation_available),
    visaSupportNeeded: typeof devProfile.visa_support_needed === "boolean" ? devProfile.visa_support_needed : undefined,
    resumeText: [selfIntroduction, projectExperience, cvText, techStack.join(", ")].filter(Boolean).join("\n\n"),
    portfolioText: [
      sanitizeString(devProfile.portfolio_url),
      sanitizeString(devProfile.github_url),
      projectExperience,
    ].filter(Boolean).join("\n\n") || undefined,
    motivation,
    concerns: (devProfile.concerns ?? []).filter(Boolean),
  };
}

function hasEnoughRecommendationInput(developer: DeveloperPreference): boolean {
  return Boolean(
    developer.availableTechStacks.length ||
      developer.targetRoles.length ||
      developer.yearsOfExperience > 0 ||
      developer.resumeText.trim().length >= 40 ||
      developer.portfolioText?.trim()
  );
}

export function buildEmployeeRecommendationsPayload(record: DeveloperProfileFull): EmployeeRecommendationsResponse {
  const developer = mapDeveloperProfileFullToPreference(record);
  const summary = {
    developerId: developer.developerId,
    name: developer.name,
    targetRoles: developer.targetRoles,
    yearsOfExperience: developer.yearsOfExperience,
    preferredLocations: developer.preferredLocations,
  };

  if (!hasEnoughRecommendationInput(developer)) {
    return {
      authenticated: true,
      developer: summary,
      recommendations: [],
      companies: [],
      generatedAt: new Date().toISOString(),
      message: "포트폴리오를 저장하면 로그인한 지원자 기준 추천 직무가 생성됩니다.",
    };
  }

  const profiles = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[]);
  const rubrics = normalizeRubrics(companyRubrics as RawCompanyEvaluationRubric[]);
  const signals = companySignals as CompanyHiringSignal[];
  const recommendations = rankCompaniesForDeveloper(developer, profiles, rubrics, signals).slice(0, 10);
  const recommendedRoleIds = new Set(recommendations.map((item) => item.roleId));

  return {
    authenticated: true,
    developer: summary,
    recommendations,
    companies: profiles.filter((company) => recommendedRoleIds.has(company.roleId)),
    generatedAt: new Date().toISOString(),
    message: recommendations.length ? undefined : "저장된 포트폴리오 기준으로 아직 추천 직무를 계산하지 못했습니다.",
  };
}