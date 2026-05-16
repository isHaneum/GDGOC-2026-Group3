import type { DeveloperLanguageCertification, DeveloperPreference } from "@shared/companyCriteriaTypes";
import { supabase } from "./supabase";

const applicantProfileBasePath = "/employer/applicants";

export function buildApplicantProfilePath(applicantId: string) {
  return `${applicantProfileBasePath}/${encodeURIComponent(applicantId)}/portfolio`;
}

export function findApplicantById(applicants: DeveloperPreference[], applicantId: string) {
  const decodedApplicantId = decodeApplicantId(applicantId);
  return applicants.find((applicant) => applicant.developerId === decodedApplicantId);
}

export async function loadApplicantProfiles(): Promise<DeveloperPreference[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured for applicant profiles.");
  }

  const { data, error } = await supabase
    .from("employee_profiles")
    .select(
      "id, full_name, nationality, years_of_experience, target_roles, preferred_company_types, tech_stack, language_certifications, preferred_salary_min, preferred_salary_max, preferred_currency, preferred_locations, work_style_preference, relocation_available, visa_support_needed, self_introduction, key_project_experience, motivation, concerns, github_url"
    );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapEmployeeProfileToDeveloperPreference(row as Record<string, unknown>));
}

export async function loadApplicantProfileById(applicantId: string): Promise<DeveloperPreference | null> {
  const applicants = await loadApplicantProfiles();
  return findApplicantById(applicants, applicantId) ?? null;
}

export function formatApplicantSalary(applicant: DeveloperPreference) {
  const currency = applicant.preferredCurrency;
  const min = applicant.preferredSalaryMin;
  const max = applicant.preferredSalaryMax;

  if (min === undefined && max === undefined) return "Not specified";
  if (min !== undefined && max !== undefined) {
    return `${formatNumber(min)}-${formatNumber(max)} ${currency}`;
  }
  if (min !== undefined) return `From ${formatNumber(min)} ${currency}`;
  return `Up to ${formatNumber(max)} ${currency}`;
}

export function formatApplicantLanguages(applicant: DeveloperPreference) {
  if (!applicant.languageCertifications.length) return ["Not specified"];

  return applicant.languageCertifications.map((language) => {
    const certification = language.certification ? ` (${language.certification})` : "";
    if (language.language === "Other") return `${language.level}${certification}`;
    return `${language.language}: ${language.level}${certification}`;
  });
}

export function formatApplicantList(values: string[] | undefined, fallback = "Not specified") {
  if (!values?.length) return fallback;
  return values.join(", ");
}

export function formatWorkStyle(workStyle: DeveloperPreference["workStylePreference"]) {
  const labels: Record<DeveloperPreference["workStylePreference"], string> = {
    any: "Any",
    hybrid: "Hybrid",
    onsite: "Onsite",
    remote: "Remote"
  };

  return labels[workStyle];
}

export function formatRelocationLabel(applicant: DeveloperPreference) {
  return applicant.relocationAvailable ? "Open to relocation" : "Relocation unavailable";
}

export function formatVisaSupportLabel(applicant: DeveloperPreference) {
  if (applicant.visaSupportNeeded === undefined) return "Visa support not specified";
  return applicant.visaSupportNeeded ? "Visa support needed" : "Visa support not needed";
}

function formatNumber(value: number | undefined) {
  return value?.toLocaleString("en-US") ?? "";
}

function mapEmployeeProfileToDeveloperPreference(row: Record<string, unknown>): DeveloperPreference {
  const id = typeof row.id === "number" ? row.id : Number(row.id);
  const concerns =
    typeof row.concerns === "string" && row.concerns
      ? row.concerns.split(/[,，、\n/;]+/).map((concern) => concern.trim()).filter(Boolean)
      : [];

  const nationalityRaw = typeof row.nationality === "string" ? row.nationality.toLowerCase() : "";
  const nationality: DeveloperPreference["nationality"] =
    nationalityRaw === "korean" ? "Korean" : nationalityRaw === "japanese" ? "Japanese" : "Other";

  return {
    developerId: Number.isFinite(id) ? `db-${id}` : `db-${String(row.id ?? "unknown")}`,
    ...(Number.isFinite(id) ? { employeeProfileId: id } : {}),
    name: typeof row.full_name === "string" ? row.full_name : "Unknown",
    nationality,
    preferredSalaryMin: typeof row.preferred_salary_min === "number" ? row.preferred_salary_min : undefined,
    preferredSalaryMax: typeof row.preferred_salary_max === "number" ? row.preferred_salary_max : undefined,
    preferredCurrency: isCurrency(row.preferred_currency) ? row.preferred_currency : "JPY",
    preferredLocations: toStringArray(row.preferred_locations),
    availableTechStacks: toStringArray(row.tech_stack),
    languageCertifications: parseLanguageCertifications(row.language_certifications),
    yearsOfExperience: typeof row.years_of_experience === "number" ? row.years_of_experience : 0,
    targetRoles: toStringArray(row.target_roles),
    preferredCompanyTypes: toStringArray(row.preferred_company_types),
    workStylePreference: isWorkStyle(row.work_style_preference) ? row.work_style_preference : "any",
    relocationAvailable: typeof row.relocation_available === "boolean" ? row.relocation_available : false,
    visaSupportNeeded: typeof row.visa_support_needed === "boolean" ? row.visa_support_needed : undefined,
    resumeText: typeof row.self_introduction === "string" ? row.self_introduction : "",
    portfolioText: typeof row.key_project_experience === "string" ? row.key_project_experience : undefined,
    motivation: typeof row.motivation === "string" ? row.motivation : undefined,
    concerns,
    githubUrl: typeof row.github_url === "string" ? row.github_url : ""
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function parseLanguageCertifications(value: unknown): DeveloperLanguageCertification[] {
  if (Array.isArray(value)) {
    return value.filter(isDeveloperLanguageCertification);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(isDeveloperLanguageCertification);
    }
  } catch {
    // Plain text from the profile form is still useful as recruiter-facing context.
  }

  return [{ language: "Other", level: value.trim() }];
}

function isDeveloperLanguageCertification(value: unknown): value is DeveloperLanguageCertification {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.language === "Japanese" ||
      record.language === "Korean" ||
      record.language === "English" ||
      record.language === "Other") &&
    typeof record.level === "string"
  );
}

function isCurrency(value: unknown): value is DeveloperPreference["preferredCurrency"] {
  return value === "JPY" || value === "KRW" || value === "USD";
}

function isWorkStyle(value: unknown): value is DeveloperPreference["workStylePreference"] {
  return value === "remote" || value === "hybrid" || value === "onsite" || value === "any";
}

function decodeApplicantId(applicantId: string) {
  try {
    return decodeURIComponent(applicantId);
  } catch {
    return applicantId;
  }
}
