import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyRubricCriterion,
  DeveloperPreference,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";

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

export async function loadCompanyRubrics(): Promise<CompanyEvaluationRubric[]> {
  const rubrics = await loadJson<RawRubric[]>(
    "/data/company-criteria/companyRubrics.json",
    "/api/company-criteria/rubrics"
  );
  return rubrics.map(normalizeRubric);
}

export function loadCompanySignals(): Promise<CompanyHiringSignal[]> {
  return loadJson<CompanyHiringSignal[]>(
    "/data/company-criteria/companySignals.json",
    "/api/company-criteria/signals"
  );
}

export function loadCompanyJobProfiles(): Promise<CompanyJobProfile[]> {
  return loadJson<CompanyJobProfile[]>(
    "/data/company-criteria/companyJobProfiles.json",
    "/api/company-criteria/job-profiles"
  );
}

export function loadSampleDeveloperProfiles(): Promise<DeveloperPreference[]> {
  return loadJson<DeveloperPreference[]>("/data/company-criteria/sampleDeveloperProfiles.json");
}

export function loadFitEngineMetadata(): Promise<FitEngineMetadata> {
  return loadJson<FitEngineMetadata>("/data/company-criteria/fitEngineMetadata.json");
}

export async function findCompanyRubric(companyId: string): Promise<CompanyEvaluationRubric | null> {
  const rubrics = await loadCompanyRubrics();
  return rubrics.find((rubric) => rubric.companyId === companyId) ?? null;
}
