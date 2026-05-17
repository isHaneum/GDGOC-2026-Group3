import companyJobProfiles from "../../public/data/company-criteria/companyJobProfiles.json";
import companyRubrics from "../../public/data/company-criteria/companyRubrics.json";
import companySignals from "../../public/data/company-criteria/companySignals.json";
import type {
  CandidateEvaluationResult,
  CandidateProfileInput,
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyRubricCriterion,
  DeveloperPreference,
  DeveloperToCompanyFitResult,
} from "../../shared/companyCriteriaTypes";
import type { EmployeeRecommendationsResponse } from "../../shared/employeeRecommendations";
import type { EmployeeProfileFull } from "../../shared/types";
import { mergeCompanySalaryDataList } from "../../src/lib/companySalaryEnrichment";
import { rankCompaniesForDeveloper } from "../../src/lib/twoSidedFitEngine";
import { evaluateCandidateForRubric } from "./candidateEvaluator";
import { getGeminiConfiguration } from "./gemini";

type RawRubricCriterion = Omit<CompanyRubricCriterion, "recommendedVerificationActivity"> & {
  recommendedVerificationActivity: string | string[];
};

type RawCompanyEvaluationRubric = Omit<CompanyEvaluationRubric, "criteria"> & {
  criteria: RawRubricCriterion[];
};

const MAX_AI_EVALUATIONS = 10;

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

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
    employeeProfileId: employeeProfile.id,
    name: sanitizeString(employeeProfile.full_name) ?? "Applicant",
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
    portfolioText: [sanitizeString(employeeProfile.github_url), projectExperience].filter(Boolean).join("\n\n") || undefined,
    motivation,
    concerns: concerns ? [concerns] : [],
    githubUrl: sanitizeString(employeeProfile.github_url),
  };
}

function buildCandidateProfileInput(developer: DeveloperPreference): CandidateProfileInput {
  return {
    candidateName: developer.name,
    targetRole: developer.targetRoles[0],
    resumeText: developer.resumeText,
    portfolioText: developer.portfolioText,
    githubSummary: [developer.githubUrl, developer.availableTechStacks.join(", ")].filter(Boolean).join("\n"),
    languageSkills: developer.languageCertifications.map((certification) =>
      [certification.language, certification.level, certification.certification].filter(Boolean).join(" ")
    ),
    projectExperience: developer.portfolioText,
    selfIntroduction: developer.resumeText,
    motivation: developer.motivation,
  };
}

function findRubricForCompany(company: CompanyJobProfile, rubrics: CompanyEvaluationRubric[]) {
  return rubrics.find((rubric) => rubric.companyId === company.rubricId || rubric.companyId === company.companyId) ?? null;
}

function mapCandidateNextStep(
  step: CandidateEvaluationResult["recommendedNextStep"]
): DeveloperToCompanyFitResult["recommendedNextStep"] {
  switch (step) {
    case "casual_interview":
      return "casual_interview";
    case "trial_project":
      return "trial_project";
    case "bridge_labs_activity":
      return "bridge_labs_activity";
    case "office_tour":
      return "research_company";
    case "not_ready_yet":
    default:
      return "rewrite_motivation";
  }
}

function mergeRecommendationWithEvaluation(
  recommendation: DeveloperToCompanyFitResult,
  evaluation: CandidateEvaluationResult
): DeveloperToCompanyFitResult {
  return {
    ...recommendation,
    overallFitScore: evaluation.overallFitScore,
    matchedReasons: unique([...evaluation.strengths, ...recommendation.matchedReasons]).slice(0, 6),
    missingSignals: unique([...evaluation.gaps, ...evaluation.recommendedActions, ...recommendation.missingSignals]).slice(0, 6),
    risks: unique([...evaluation.risks, ...recommendation.risks]).slice(0, 5),
    recommendedNextStep: mapCandidateNextStep(evaluation.recommendedNextStep),
    explanation: evaluation.recruiterLensSummary,
  };
}

function buildAiEvaluationMessage(
  geminiConfigured: boolean,
  evaluatedCompanyCount: number,
  geminiUsedCount: number,
  fallbackCount: number
) {
  if (!evaluatedCompanyCount) {
    return geminiConfigured
      ? "No recommendation candidates were available for Gemini evaluation."
      : "GEMINI_API_KEY is not configured, so portfolio AI evaluation could not run.";
  }

  if (!geminiConfigured) {
    return "GEMINI_API_KEY is not configured, so recommendations were calculated with the local fallback.";
  }

  if (geminiUsedCount === evaluatedCompanyCount) {
    return "Recommendations include Google Gemini evaluation based on the portfolio.";
  }

  if (geminiUsedCount > 0) {
    return `${geminiUsedCount} of ${evaluatedCompanyCount} candidates used Gemini evaluation; ${fallbackCount} used fallback scoring.`;
  }

  return "Gemini evaluation was attempted, but all results used fallback scoring. Check the API key and quota.";
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

export async function buildEmployeeRecommendationsPayload(record: EmployeeProfileFull): Promise<EmployeeRecommendationsResponse> {
  const developer = mapDeveloperProfileFullToPreference(record);
  const geminiConfiguration = getGeminiConfiguration();
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
      aiEvaluation: {
        geminiConfigured: geminiConfiguration.configured,
        evaluatedCompanyCount: 0,
        geminiUsedCount: 0,
        fallbackCount: 0,
        message: buildAiEvaluationMessage(geminiConfiguration.configured, 0, 0, 0),
      },
      message: "Save a portfolio to generate role recommendations for the signed-in applicant.",
    };
  }

  const profiles = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[]);
  const rubrics = normalizeRubrics(companyRubrics as RawCompanyEvaluationRubric[]);
  const signals = companySignals as CompanyHiringSignal[];
  const baseRecommendations = rankCompaniesForDeveloper(developer, profiles, rubrics, signals).slice(0, MAX_AI_EVALUATIONS);
  const candidateInput = buildCandidateProfileInput(developer);
  const companiesByRoleId = new Map(profiles.map((company) => [company.roleId, company]));

  const evaluatedResults = await Promise.all(
    baseRecommendations.map(async (recommendation) => {
      const company = companiesByRoleId.get(recommendation.roleId);
      if (!company) {
        return { recommendation, evaluation: null as CandidateEvaluationResult | null };
      }

      const rubric = findRubricForCompany(company, rubrics);
      if (!rubric) {
        return { recommendation, evaluation: null as CandidateEvaluationResult | null };
      }

      try {
        const evaluation = await evaluateCandidateForRubric(candidateInput, rubric);
        return { recommendation, evaluation };
      } catch {
        return { recommendation, evaluation: null as CandidateEvaluationResult | null };
      }
    })
  );

  const recommendations = evaluatedResults
    .map(({ recommendation, evaluation }) => (evaluation ? mergeRecommendationWithEvaluation(recommendation, evaluation) : recommendation))
    .sort((left, right) => right.overallFitScore - left.overallFitScore);

  const evaluatedCompanyCount = evaluatedResults.filter((item) => item.evaluation !== null).length;
  const geminiUsedCount = evaluatedResults.filter((item) => item.evaluation?.debug.geminiUsed).length;
  const fallbackCount = evaluatedResults.filter((item) => item.evaluation && !item.evaluation.debug.geminiUsed).length;
  const recommendedRoleIds = new Set(recommendations.map((item) => item.roleId));

  return {
    authenticated: true,
    developer: summary,
    recommendations,
    companies: profiles.filter((company) => recommendedRoleIds.has(company.roleId)),
    generatedAt: new Date().toISOString(),
    aiEvaluation: {
      geminiConfigured: geminiConfiguration.configured,
      evaluatedCompanyCount,
      geminiUsedCount,
      fallbackCount,
      message: buildAiEvaluationMessage(geminiConfiguration.configured, evaluatedCompanyCount, geminiUsedCount, fallbackCount),
    },
    message: recommendations.length ? undefined : "No role recommendations could be calculated from the saved portfolio yet.",
  };
}
