import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyRubricCriterion,
  DeveloperPreference,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";
import { supabase } from "./supabase";

type RawRubricCriterion = Omit<CompanyRubricCriterion, "recommendedVerificationActivity"> & {
  recommendedVerificationActivity: string | string[];
};

type RawRubric = Omit<CompanyEvaluationRubric, "criteria"> & {
  criteria: RawRubricCriterion[];
};

async function loadJson<T>(path: string, fallbackPath?: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok && fallbackPath) {
    return loadJson<T>(fallbackPath);
  }

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json() as Promise<T>;
}

function normalizeCriterion(criterion: RawRubricCriterion): CompanyRubricCriterion {
  return {
    ...criterion,
    recommendedVerificationActivity: Array.isArray(criterion.recommendedVerificationActivity)
      ? criterion.recommendedVerificationActivity
      : [criterion.recommendedVerificationActivity]
  };
}

function normalizeRubric(rubric: RawRubric): CompanyEvaluationRubric {
  return {
    ...rubric,
    criteria: rubric.criteria.map(normalizeCriterion)
  };
}

function toRubric(row: Record<string, unknown>): CompanyEvaluationRubric {
  const criteria = (row.criteria as RawRubricCriterion[]) ?? [];
  return {
    companyId: row.company_id as string,
    companyName: row.company_name as string,
    targetRole: row.target_role as string,
    totalWeight: row.total_weight as number,
    criteria: criteria.map(normalizeCriterion),
    rubricSummary: row.rubric_summary as string,
    generatedAt: row.generated_at as string
  };
}

function toSignal(row: Record<string, unknown>): CompanyHiringSignal {
  return {
    companyId: row.company_id as string,
    companyName: row.company_name as string,
    country: row.country as CompanyHiringSignal["country"],
    industry: row.industry as string,
    roles: (row.roles as string[]) ?? [],
    requiredTechnicalSkills: (row.required_technical_skills as string[]) ?? [],
    preferredTechnicalSkills: (row.preferred_technical_skills as string[]) ?? [],
    languageExpectation: (row.language_expectation as string[]) ?? [],
    workStyle: (row.work_style as string[]) ?? [],
    companyValues: (row.company_values as string[]) ?? [],
    preferredSoftSkills: (row.preferred_soft_skills as string[]) ?? [],
    evaluationSignals: (row.evaluation_signals as string[]) ?? [],
    riskConcerns: (row.risk_concerns as string[]) ?? [],
    recommendedCandidateEvidence: (row.recommended_candidate_evidence as string[]) ?? [],
    extractedSummary: row.extracted_summary as string,
    confidenceScore: row.confidence_score as number,
    sourceIds: (row.source_ids as string[]) ?? []
  };
}

function toJobProfile(row: Record<string, unknown>): CompanyJobProfile {
  return {
    companyId: row.company_id as string,
    companyName: row.company_name as string,
    roleId: row.role_id as string,
    roleTitle: row.role_title as string,
    country: row.country as CompanyJobProfile["country"],
    salaryMin: row.salary_min as number | undefined,
    salaryMax: row.salary_max as number | undefined,
    salaryCurrency: row.salary_currency as CompanyJobProfile["salaryCurrency"],
    locations: (row.locations as string[]) ?? [],
    requiredTechStacks: (row.required_tech_stacks as string[]) ?? [],
    preferredTechStacks: (row.preferred_tech_stacks as string[]) ?? [],
    requiredLanguages: (row.required_languages as CompanyJobProfile["requiredLanguages"]) ?? [],
    preferredLanguages: (row.preferred_languages as CompanyJobProfile["preferredLanguages"]) ?? [],
    experienceRange: {
      minYears: row.experience_min_years as number | undefined,
      maxYears: row.experience_max_years as number | undefined
    },
    workStyle: row.work_style as CompanyJobProfile["workStyle"],
    companyType: row.company_type as string,
    roleCategory: row.role_category as CompanyJobProfile["roleCategory"],
    rubricId: row.rubric_id as string,
    sourceConfidence: row.source_confidence as CompanyJobProfile["sourceConfidence"],
    sourceUrls: row.source_urls as string[] | undefined,
    notes: row.notes as string | undefined
  };
}

export async function loadCompanyRubrics(): Promise<CompanyEvaluationRubric[]> {
  return loadSupabaseWithFallback(
    async () => {
      const { data, error } = await supabase.from("company_evaluation_rubrics").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map(toRubric);
    },
    async () => {
      const rubrics = await loadJson<RawRubric[]>(
        "/api/company-criteria/rubrics",
        "/data/company-criteria/companyRubrics.json"
      );
      return rubrics.map(normalizeRubric);
    }
  );
}

export async function loadCompanySignals(): Promise<CompanyHiringSignal[]> {
  return loadSupabaseWithFallback(
    async () => {
      const { data, error } = await supabase.from("company_hiring_signals").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map(toSignal);
    },
    () =>
      loadJson<CompanyHiringSignal[]>(
        "/api/company-criteria/signals",
        "/data/company-criteria/companySignals.json"
      )
  );
}

export async function loadCompanyJobProfiles(): Promise<CompanyJobProfile[]> {
  return loadSupabaseWithFallback(
    async () => {
      const { data, error } = await supabase.from("company_job_profiles").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map(toJobProfile);
    },
    () =>
      loadJson<CompanyJobProfile[]>(
        "/api/company-criteria/job-profiles",
        "/data/company-criteria/companyJobProfiles.json"
      )
  );
}

export async function findCompanyRubric(companyId: string): Promise<CompanyEvaluationRubric | null> {
  const rubrics = await loadCompanyRubrics();
  return rubrics.find((rubric) => rubric.companyId === companyId) ?? null;
}

export function loadSampleDeveloperProfiles(): Promise<DeveloperPreference[]> {
  return loadJson<DeveloperPreference[]>("/data/company-criteria/sampleDeveloperProfiles.json");
}

export function loadFitEngineMetadata(): Promise<FitEngineMetadata> {
  return loadJson<FitEngineMetadata>("/data/company-criteria/fitEngineMetadata.json");
}

async function loadSupabaseWithFallback<T>(loadPrimary: () => Promise<T[]>, loadFallback: () => Promise<T[]>): Promise<T[]> {
  try {
    const primary = await loadPrimary();
    if (primary.length > 0) return primary;
  } catch {
    // Static fixtures keep demo screens usable when Supabase is unavailable.
  }

  return loadFallback();
}
