import type { CompanyEvaluationRubric, CompanyRubricCriterion } from "../../shared/companyCriteriaTypes";

type RawRubricCriterion = Omit<CompanyRubricCriterion, "recommendedVerificationActivity"> & {
  recommendedVerificationActivity: string | string[];
};

type RawRubric = Omit<CompanyEvaluationRubric, "criteria"> & {
  criteria: RawRubricCriterion[];
};

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
  const response = await fetch("/data/company-criteria/companyRubrics.json");
  if (!response.ok) {
    throw new Error("Failed to load company rubrics");
  }

  const rubrics = (await response.json()) as RawRubric[];
  return rubrics.map(normalizeRubric);
}

export async function findCompanyRubric(companyId: string): Promise<CompanyEvaluationRubric | null> {
  const rubrics = await loadCompanyRubrics();
  return rubrics.find((rubric) => rubric.companyId === companyId) ?? null;
}