import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  DeveloperLanguageCertification,
  DeveloperPreference,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";
import { mergeCompanySalaryDataList } from "./companySalaryEnrichment";
import { supabase } from "./supabase";

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

function mapEmployeeProfileToDeveloperPreference(row: Record<string, unknown>): DeveloperPreference {
  let languageCertifications: DeveloperLanguageCertification[] = [];
  if (typeof row.language_certifications === "string") {
    try {
      languageCertifications = JSON.parse(row.language_certifications);
    } catch {
      languageCertifications = [];
    }
  }

  const concerns =
    typeof row.concerns === "string" && row.concerns
      ? row.concerns.split(",").map((c) => c.trim()).filter(Boolean)
      : undefined;

  const nationalityRaw = typeof row.nationality === "string" ? row.nationality.toLowerCase() : "";
  const nationality: DeveloperPreference["nationality"] =
    nationalityRaw === "korean" ? "Korean" : nationalityRaw === "japanese" ? "Japanese" : "Other";

  return {
    developerId: `db-${row.id}`,
    name: typeof row.full_name === "string" ? row.full_name : "Unknown",
    nationality,
    preferredSalaryMin: typeof row.preferred_salary_min === "number" ? row.preferred_salary_min : undefined,
    preferredSalaryMax: typeof row.preferred_salary_max === "number" ? row.preferred_salary_max : undefined,
    preferredCurrency: (row.preferred_currency as "JPY" | "KRW" | "USD") ?? "JPY",
    preferredLocations: Array.isArray(row.preferred_locations) ? (row.preferred_locations as string[]) : [],
    availableTechStacks: Array.isArray(row.tech_stack) ? (row.tech_stack as string[]) : [],
    languageCertifications,
    yearsOfExperience: typeof row.years_of_experience === "number" ? row.years_of_experience : 0,
    targetRoles: Array.isArray(row.target_roles) ? (row.target_roles as string[]) : [],
    preferredCompanyTypes: Array.isArray(row.preferred_company_types) ? (row.preferred_company_types as string[]) : [],
    workStylePreference: (row.work_style_preference as "remote" | "hybrid" | "onsite" | "any") ?? "any",
    relocationAvailable: typeof row.relocation_available === "boolean" ? row.relocation_available : false,
    visaSupportNeeded: typeof row.visa_support_needed === "boolean" ? row.visa_support_needed : undefined,
    resumeText: typeof row.self_introduction === "string" ? row.self_introduction : "",
    portfolioText: typeof row.key_project_experience === "string" ? row.key_project_experience : undefined,
    motivation: typeof row.motivation === "string" ? row.motivation : undefined,
    concerns,
  };
}

export async function loadSampleDeveloperProfiles(): Promise<DeveloperPreference[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("employee_profiles")
        .select(
          "id, full_name, nationality, years_of_experience, target_roles, preferred_company_types, tech_stack, language_certifications, preferred_salary_min, preferred_salary_max, preferred_currency, preferred_locations, work_style_preference, relocation_available, visa_support_needed, self_introduction, key_project_experience, motivation, concerns"
        );

      if (!error && data && data.length > 0) {
        return data.map((row) => mapEmployeeProfileToDeveloperPreference(row as Record<string, unknown>));
      }
    } catch {
      // fall through to JSON
    }
  }

  return loadStaticJson<DeveloperPreference[]>("/data/company-criteria/sampleDeveloperProfiles.json");
}

export function loadFitEngineMetadata(): Promise<FitEngineMetadata> {
  return loadStaticJson<FitEngineMetadata>("/data/company-criteria/fitEngineMetadata.json");
}
