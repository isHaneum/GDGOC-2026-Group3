import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";
import { mergeCompanySalaryDataList } from "./companySalaryEnrichment";

async function loadStaticJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json() as Promise<T>;
}

const STATIC_RUBRICS_PATH = "/data/company-criteria/companyRubrics.json";
const STATIC_SIGNALS_PATH = "/data/company-criteria/companySignals.json";
const STATIC_JOB_PROFILES_PATH = "/data/company-criteria/companyJobProfiles.json";

async function loadStaticCompanyJobProfiles(): Promise<CompanyJobProfile[]> {
  const profiles = await loadStaticJson<CompanyJobProfile[]>(STATIC_JOB_PROFILES_PATH);
  return mergeCompanySalaryDataList(profiles);
}

export async function loadCompanyRubrics(): Promise<CompanyEvaluationRubric[]> {
  return loadStaticJson<CompanyEvaluationRubric[]>(STATIC_RUBRICS_PATH);
}

export async function loadCompanySignals(): Promise<CompanyHiringSignal[]> {
  return loadStaticJson<CompanyHiringSignal[]>(STATIC_SIGNALS_PATH);
}

export async function loadCompanyJobProfiles(): Promise<CompanyJobProfile[]> {
  return loadStaticCompanyJobProfiles();
}

export async function findCompanyRubric(companyId: string): Promise<CompanyEvaluationRubric | null> {
  const rubrics = await loadCompanyRubrics();
  return rubrics.find((rubric) => rubric.companyId === companyId) ?? null;
}

export function loadFitEngineMetadata(): Promise<FitEngineMetadata> {
  return loadStaticJson<FitEngineMetadata>("/data/company-criteria/fitEngineMetadata.json");
}
