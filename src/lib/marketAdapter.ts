import type { MarketConfig } from "../../shared/market";
import type {
  DeveloperProfile,
  Locale,
  ResumeContextLocale,
  ResumeContextMappingRequest
} from "../../shared/types";
import type { CandidateProfileInput, DeveloperPreference } from "../../shared/companyCriteriaTypes";
import { defaultProfiles } from "../i18n";

type MarketDirection = {
  sourceLocale: "ko" | "ja";
  targetLocale: ResumeContextLocale;
  profileLocale: Locale;
  sourceCountry: "Korea" | "Japan";
  targetCountry: "Korea" | "Japan";
  sourceNationality: "Korean" | "Japanese";
};

export function getMarketDirection(market: MarketConfig): MarketDirection {
  if (market.id === "jp-kr") {
    return {
      sourceLocale: "ja",
      targetLocale: "ko",
      profileLocale: "ja",
      sourceCountry: "Japan",
      targetCountry: "Korea",
      sourceNationality: "Japanese"
    };
  }

  return {
    sourceLocale: "ko",
    targetLocale: "ja",
    profileLocale: "ko",
    sourceCountry: "Korea",
    targetCountry: "Japan",
    sourceNationality: "Korean"
  };
}

export function getMarketDeveloperProfile(market: MarketConfig): DeveloperProfile {
  const direction = getMarketDirection(market);
  const profile = defaultProfiles[direction.profileLocale];

  return {
    ...profile,
    targetCountry: direction.targetCountry,
    uiLocale: direction.targetLocale
  };
}

export function filterDevelopersForMarket(
  developers: DeveloperPreference[],
  market: MarketConfig
): DeveloperPreference[] {
  const direction = getMarketDirection(market);
  const filtered = developers.filter((developer) => developer.nationality === direction.sourceNationality);
  return filtered.length ? filtered : developers;
}

export function buildCandidateEvaluationInput(candidate: DeveloperPreference): CandidateProfileInput {
  return {
    candidateName: candidate.name,
    targetRole: candidate.targetRoles[0],
    resumeText: candidate.resumeText,
    portfolioText: candidate.portfolioText,
    githubSummary: candidate.availableTechStacks.join(", "),
    languageSkills: candidate.languageCertifications.map((certification) =>
      [certification.language, certification.level, certification.certification].filter(Boolean).join(" ")
    ),
    projectExperience: candidate.resumeText,
    selfIntroduction: candidate.portfolioText,
    motivation: candidate.motivation
  };
}

export function buildResumeContextRequest(
  candidate: DeveloperPreference,
  market: MarketConfig
): ResumeContextMappingRequest {
  const direction = getMarketDirection(market);

  return {
    targetLocale: direction.targetLocale,
    sourceLocaleHint: direction.sourceLocale,
    applicant: {
      applicantId: candidate.developerId,
      ...(candidate.employeeProfileId ? { employeeProfileId: candidate.employeeProfileId } : {}),
      name: candidate.name,
      nationality: candidate.nationality,
      yearsOfExperience: candidate.yearsOfExperience,
      targetRoles: candidate.targetRoles
    },
    portfolio: {
      techStack: candidate.availableTechStacks,
      languageCertifications: candidate.languageCertifications.map((certification) =>
        [certification.language, certification.level, certification.certification].filter(Boolean).join(" ")
      ),
      preferredSalary: formatPreferredSalary(candidate),
      preferredLocations: candidate.preferredLocations,
      preferredCompanyTypes: candidate.preferredCompanyTypes,
      workStylePreference: candidate.workStylePreference,
      relocationAvailable: candidate.relocationAvailable,
      visaSupportNeeded: candidate.visaSupportNeeded ?? false,
      selfIntroduction: candidate.resumeText,
      keyProjectExperience: candidate.portfolioText ?? "",
      motivation: candidate.motivation ?? "",
      concerns: candidate.concerns ?? [],
      githubUrl: candidate.githubUrl ?? ""
    }
  };
}

function formatPreferredSalary(candidate: DeveloperPreference) {
  const min = candidate.preferredSalaryMin;
  const max = candidate.preferredSalaryMax;

  if (min === undefined && max === undefined) return "";
  if (min !== undefined && max !== undefined) {
    return `${min.toLocaleString("en-US")}-${max.toLocaleString("en-US")} ${candidate.preferredCurrency}`;
  }
  if (min !== undefined) return `From ${min.toLocaleString("en-US")} ${candidate.preferredCurrency}`;
  return `Up to ${max?.toLocaleString("en-US")} ${candidate.preferredCurrency}`;
}
