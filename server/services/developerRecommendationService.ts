import companyJobProfiles from "../../public/data/company-criteria/companyJobProfiles.json";
import companyRubrics from "../../public/data/company-criteria/companyRubrics.json";
import companySignals from "../../public/data/company-criteria/companySignals.json";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyRubricCriterion,
  DeveloperPreference,
} from "../../shared/companyCriteriaTypes";
import type { EmployeeRecommendationsResponse } from "../../shared/employeeRecommendations";
import type { EmployeeProfileFull } from "../../shared/types";
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
  value?: string | null
): DeveloperPreference["languageCertifications"] {
  return (value ?? "")
    .split(/[,，、\n/;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const normalized = item.toLowerCase();
      const language =
        normalized.includes("japan") || normalized.includes("jlpt") || normalized.includes("일본")
          ? "Japanese"
          : normalized.includes("korean") || normalized.includes("한국") || normalized.includes("topik")
            ? "Korean"
            : normalized.includes("english") || normalized.includes("toeic") || normalized.includes("ielts")
              ? "English"
              : "Other";

      return {
        language,
        level: item,
        certification: item,
      };
    });
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

export function mapDeveloperProfileFullToPreference(record: EmployeeProfileFull): DeveloperPreference {
  const { profile, employeeProfile } = record;
  const techStack = (employeeProfile.tech_stack ?? []).filter(Boolean);
  const targetRoles = (employeeProfile.target_roles ?? []).filter(Boolean);
  const projectExperience = sanitizeString(employeeProfile.key_project_experience);
  const selfIntroduction = sanitizeString(employeeProfile.self_introduction);
  const motivation = sanitizeString(employeeProfile.motivation);
  const concerns = sanitizeString(employeeProfile.concerns);

  return {
    developerId: String(profile.user_id ?? profile.id),
    name: sanitizeString(employeeProfile.full_name) ?? "지원자",
    nationality: normalizeNationality(employeeProfile.nationality),
    preferredSalaryMin: typeof employeeProfile.preferred_salary_min === "number" ? employeeProfile.preferred_salary_min : undefined,
    preferredSalaryMax: typeof employeeProfile.preferred_salary_max === "number" ? employeeProfile.preferred_salary_max : undefined,
    preferredCurrency: normalizeCurrency(employeeProfile.preferred_currency),
    preferredLocations: (employeeProfile.preferred_locations ?? []).filter(Boolean),
    availableTechStacks: techStack,
    languageCertifications: normalizeLanguageCertifications(employeeProfile.language_certifications),
    yearsOfExperience: employeeProfile.years_of_experience,
    targetRoles: targetRoles.length ? targetRoles : ["Software Engineer"],
    preferredCompanyTypes: (employeeProfile.preferred_company_types ?? []).filter(Boolean),
    workStylePreference: normalizeWorkStyle(employeeProfile.work_style_preference),
    relocationAvailable: Boolean(employeeProfile.relocation_available),
    visaSupportNeeded: employeeProfile.visa_support_needed,
    resumeText: [selfIntroduction, projectExperience, motivation, techStack.join(", ")].filter(Boolean).join("\n\n"),
    portfolioText: [
      sanitizeString(employeeProfile.github_url),
      projectExperience,
    ].filter(Boolean).join("\n\n") || undefined,
    motivation,
    concerns: concerns ? [concerns] : [],
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

export function buildEmployeeRecommendationsPayload(record: EmployeeProfileFull): EmployeeRecommendationsResponse {
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
