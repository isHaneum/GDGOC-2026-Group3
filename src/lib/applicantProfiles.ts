import type { DeveloperPreference } from "@shared/companyCriteriaTypes";

const applicantProfileBasePath = "/employer/applicants/applicant";

export function buildApplicantProfilePath(applicantId: string) {
  return `${applicantProfileBasePath}/${encodeURIComponent(applicantId)}/profile`;
}

export function findApplicantById(applicants: DeveloperPreference[], applicantId: string) {
  const decodedApplicantId = decodeApplicantId(applicantId);
  return applicants.find((applicant) => applicant.developerId === decodedApplicantId);
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

function decodeApplicantId(applicantId: string) {
  try {
    return decodeURIComponent(applicantId);
  } catch {
    return applicantId;
  }
}
