import type {
  CompanyJobProfile,
  CompanyToDeveloperFitResult,
  DeveloperPreference,
  DeveloperToCompanyFitResult
} from "../../shared/companyCriteriaTypes";

export type FitLabelKey = "fitVeryStrong" | "fitStrong" | "fitPotential" | "fitNeedsPreparation" | "fitLow";
export type FitTone = "green" | "teal" | "amber" | "slate";
export type NextStepKey =
  | "nextApplyNow"
  | "nextTrialProject"
  | "nextCasualInterview"
  | "nextResearchCompany"
  | "nextRewriteMotivation"
  | "nextBridgeLabs";
export type RecruiterActionKey =
  | "actionSaveCandidate"
  | "actionRequestPassport"
  | "actionInviteOfficeTour"
  | "actionCasualInterview"
  | "actionTrialProject"
  | "actionRecommendBridgeLabs";

export type MissingDataLabelKey =
  | "missingLogo"
  | "missingSalary"
  | "missingLocation"
  | "missingLanguageRequirement"
  | "missingExperienceRange"
  | "missingRequiredTechStacks"
  | "missingPreferredTechStacks"
  | "missingWorkStyle"
  | "missingRoleSpecificSource"
  | "missingOfficialSourceUrl"
  | "missingOfficialJobPostingUrl"
  | "missingHiringPeriod"
  | "missingQualificationSummary"
  | "missingJobDescriptionSummary"
  | "missingApplicationDeadline";

type CompanyJobProfileDisplayFields = CompanyJobProfile & {
  logoUrl?: string | null;
  logoAlt?: string | null;
  salaryNote?: string;
  startingSalaryMin?: number | null;
  startingSalaryMax?: number | null;
  startingSalaryCurrency?: CompanyJobProfile["salaryCurrency"];
  startingSalaryNote?: string;
  jobPostingUrl?: string;
  jobPostingStatus?: "open" | "closed" | "unknown";
  hiringPeriod?: {
    startDate?: string | null;
    endDate?: string | null;
    note?: string;
  };
  applicationDeadline?: string | null;
  employmentType?: "full-time" | "internship" | "contract" | "new-grad" | "unknown";
  qualificationSummary?: string[];
  jobDescriptionSummary?: string;
  benefitsSummary?: string[];
  selectionProcess?: string[];
  lastVerifiedAt?: string;
  missingFields?: string[];
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣一-龥ぁ-んァ-ン]+/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getFitLabel(score: number): FitLabelKey {
  if (score >= 85) return "fitVeryStrong";
  if (score >= 75) return "fitStrong";
  if (score >= 65) return "fitPotential";
  if (score >= 50) return "fitNeedsPreparation";
  return "fitLow";
}

export function getFitTone(score: number): FitTone {
  if (score >= 85) return "green";
  if (score >= 65) return "teal";
  if (score >= 50) return "amber";
  return "slate";
}

export function deriveKeySignals(result: CompanyToDeveloperFitResult, developer: DeveloperPreference | undefined): string[] {
  if (!developer) return result.topMatchSignals.slice(0, 3);

  const topSignalText = normalizeText(result.topMatchSignals.join(" "));
  const matchedTech = developer.availableTechStacks.filter((stack) => topSignalText.includes(normalizeText(stack)));
  const languageSignals = developer.languageCertifications.map((item) => item.certification ?? `${item.language} ${item.level}`);
  const roleSignals = developer.targetRoles.map((role) => role.replace(/\s*Engineer$/i, ""));

  return unique([
    ...matchedTech,
    ...developer.availableTechStacks,
    ...languageSignals,
    ...roleSignals,
    ...result.topMatchSignals
  ]).slice(0, 3);
}

function formatToK(value: number): string {
  const inK = Math.round(value / 1000);
  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${formatter.format(inK)}K`;
}

function formatCurrencySymbol(currency: string): string {
  if (currency === "JPY") return "¥";
  if (currency === "KRW") return "₩";
  return currency;
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: CompanyJobProfile["salaryCurrency"] | DeveloperPreference["preferredCurrency"],
  fallback: string,
  note?: string
): string {
  if (currency === "unknown" || typeof min !== "number" || typeof max !== "number") {
    return note ? `${fallback} (${note})` : fallback;
  }

  return `${formatCurrencySymbol(currency)}${formatToK(min)} - ${formatCurrencySymbol(currency)}${formatToK(max)}`;
}

export function formatCompanySalarySummary(profile: CompanyJobProfile, fallback: string): string {
  const displayProfile = profile as CompanyJobProfileDisplayFields;
  const salary = formatSalaryRange(profile.salaryMin, profile.salaryMax, profile.salaryCurrency, fallback, displayProfile.salaryNote);
  if (salary !== fallback && !salary.startsWith(fallback)) return salary;

  if (
    typeof displayProfile.startingSalaryMin === "number" &&
    typeof displayProfile.startingSalaryMax === "number" &&
    displayProfile.startingSalaryCurrency &&
    displayProfile.startingSalaryCurrency !== "unknown"
  ) {
    return `Starting ${formatSalaryRange(
      displayProfile.startingSalaryMin,
      displayProfile.startingSalaryMax,
      displayProfile.startingSalaryCurrency,
      fallback,
      displayProfile.startingSalaryNote
    )}`;
  }

  if (
    typeof displayProfile.averageAnnualSalary === "number" &&
    displayProfile.startingSalaryCurrency &&
    displayProfile.startingSalaryCurrency !== "unknown"
  ) {
    return `Average ${formatCurrencySymbol(displayProfile.startingSalaryCurrency)}${formatToK(displayProfile.averageAnnualSalary)}`;
  }

  return displayProfile.salaryNote ? `${fallback} (${displayProfile.salaryNote})` : fallback;
}

export function formatCompanyLogo(profile: CompanyJobProfile): { src: string; alt: string } | null {
  const displayProfile = profile as CompanyJobProfileDisplayFields;
  if (!displayProfile.logoUrl) return null;
  return {
    src: displayProfile.logoUrl,
    alt: displayProfile.logoAlt ?? `${profile.companyName} logo`
  };
}

export function formatHiringPeriodSummary(profile: CompanyJobProfile, fallback: string): string {
  const period = (profile as CompanyJobProfileDisplayFields).hiringPeriod;
  if (!period) return fallback;
  if (period.startDate && period.endDate) return `${period.startDate} - ${period.endDate}`;
  if (period.startDate) return `${period.startDate} -`;
  if (period.endDate) return `Until ${period.endDate}`;
  return period.note && period.note !== "Confirmation needed" ? period.note : fallback;
}

export function formatJobPostingStatus(profile: CompanyJobProfile, fallback: string): string {
  const status = (profile as CompanyJobProfileDisplayFields).jobPostingStatus;
  if (!status || status === "unknown") return fallback;
  return status === "open" ? "Open" : "Closed";
}

export function formatQualificationSummary(profile: CompanyJobProfile, fallback: string): string {
  const qualificationSummary = (profile as CompanyJobProfileDisplayFields).qualificationSummary;
  if (qualificationSummary?.length) return qualificationSummary.slice(0, 4).join(", ");
  return fallback;
}

export function getJobPostingUrl(profile: CompanyJobProfile): string {
  return (profile as CompanyJobProfileDisplayFields).jobPostingUrl ?? "";
}

export function formatRoleTitle(profile: CompanyJobProfile): string {
  return `${profile.companyName} · ${profile.roleTitle}`;
}

export function formatSourceConfidence(profile: CompanyJobProfile): string {
  return profile.sourceConfidence === "fallback"
    ? "Fallback source"
    : `${profile.sourceConfidence[0].toUpperCase()}${profile.sourceConfidence.slice(1)} confidence`;
}

export function getMissingDataLabel(field: string): MissingDataLabelKey {
  const labels: Record<string, MissingDataLabelKey> = {
    logo: "missingLogo",
    salary: "missingSalary",
    location: "missingLocation",
    languageRequirement: "missingLanguageRequirement",
    experienceRange: "missingExperienceRange",
    requiredTechStacks: "missingRequiredTechStacks",
    preferredTechStacks: "missingPreferredTechStacks",
    workStyle: "missingWorkStyle",
    roleSpecificSource: "missingRoleSpecificSource",
    officialSourceUrl: "missingOfficialSourceUrl",
    officialJobPostingUrl: "missingOfficialJobPostingUrl",
    hiringPeriod: "missingHiringPeriod",
    qualificationSummary: "missingQualificationSummary",
    jobDescriptionSummary: "missingJobDescriptionSummary",
    applicationDeadline: "missingApplicationDeadline"
  };

  return labels[field] ?? "missingRoleSpecificSource";
}

export function formatLocationSummary(profile: CompanyJobProfile, fallback: string): string {
  if (!profile.locations.length || profile.locations.includes("unknown")) {
    return fallback;
  }

  const values = [...profile.locations];
  if (profile.workStyle !== "unknown") {
    values.push(profile.workStyle === "hybrid" ? "Hybrid" : profile.workStyle === "remote" ? "Remote" : "On-site");
  }

  return unique(values).join(" / ");
}

export function formatLanguageSummary(profile: CompanyJobProfile, fallback: string): string {
  const languages = profile.requiredLanguages.length ? profile.requiredLanguages : profile.preferredLanguages ?? [];
  if (!languages.length) return fallback;
  return languages.map((item) => `${item.language} ${item.level}`).join(", ");
}

export function formatExperienceRange(profile: CompanyJobProfile, fallback: string): string {
  const { minYears, maxYears } = profile.experienceRange;
  if (typeof minYears !== "number" && typeof maxYears !== "number") return fallback;
  if (typeof minYears === "number" && typeof maxYears === "number") return `${minYears}-${maxYears}y`;
  if (typeof minYears === "number") return `${minYears}y+`;
  return `~${maxYears}y`;
}

export function getDeveloperNextStepKey(step: DeveloperToCompanyFitResult["recommendedNextStep"]): NextStepKey {
  const labels: Record<DeveloperToCompanyFitResult["recommendedNextStep"], NextStepKey> = {
    apply_now: "nextApplyNow",
    trial_project: "nextTrialProject",
    casual_interview: "nextCasualInterview",
    research_company: "nextResearchCompany",
    rewrite_motivation: "nextRewriteMotivation",
    bridge_labs_activity: "nextBridgeLabs"
  };

  return labels[step];
}

export function getRecruiterActionKey(action: CompanyToDeveloperFitResult["recommendedRecruiterAction"]): RecruiterActionKey {
  const labels: Record<CompanyToDeveloperFitResult["recommendedRecruiterAction"], RecruiterActionKey> = {
    save_candidate: "actionSaveCandidate",
    request_passport: "actionRequestPassport",
    invite_office_tour: "actionInviteOfficeTour",
    casual_interview: "actionCasualInterview",
    trial_project: "actionTrialProject",
    recommend_bridge_labs: "actionRecommendBridgeLabs"
  };

  return labels[action];
}