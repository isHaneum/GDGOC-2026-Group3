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
  const contents = [
    { name: "Name", content: candidate.name },
    { name: "Nationality", content: candidate.nationality },
    { name: "Target Roles", content: candidate.targetRoles.join(", ") },
    { name: "Core Tech Stack", content: candidate.availableTechStacks.join(", ") },
    {
      name: "Target Language Level",
      content: candidate.languageCertifications
        .map((certification) =>
          [certification.language, certification.level, certification.certification].filter(Boolean).join(" ")
        )
        .join(", ")
    },
    { name: "Years of Experience", content: `${candidate.yearsOfExperience}` },
    { name: "Preferred Locations", content: candidate.preferredLocations.join(", ") },
    { name: "Work Style Preference", content: candidate.workStylePreference },
    { name: "Resume Text", content: candidate.resumeText },
    { name: "Portfolio Text", content: candidate.portfolioText ?? "Not provided" },
    { name: "Motivation", content: candidate.motivation ?? "Not provided" },
    { name: "Recruiter Concerns", content: candidate.concerns?.join(", ") ?? "Not provided" }
  ];

  return {
    targetLocale: direction.targetLocale,
    contents
  };
}
