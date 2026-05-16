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

export function formatSalaryRange(
  min: number | undefined,
  max: number | undefined,
  currency: CompanyJobProfile["salaryCurrency"] | DeveloperPreference["preferredCurrency"],
  fallback: string
): string {
  if (currency === "unknown" || typeof min !== "number" || typeof max !== "number") {
    return fallback;
  }

  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${currency} ${formatter.format(min)} - ${formatter.format(max)}`;
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