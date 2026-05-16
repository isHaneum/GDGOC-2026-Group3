import type { Country, ExtractedHiringSignal, RawCareerSource, RoleBaseline } from "../../shared/types";
import { recommendBridgeLabs } from "./bridgeLabs";

const canonicalTerms: Record<string, string> = {
  "react.js": "React",
  react: "React",
  typescript: "TypeScript",
  javascript: "JavaScript",
  "rest api": "REST API",
  "api design": "REST API design",
  sql: "SQL",
  "node.js": "Node.js",
  nodejs: "Node.js",
  java: "Java",
  python: "Python",
  mlops: "MLOps",
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  github: "GitHub portfolio",
  readme: "README",
  "pull request": "Pull request history",
  "code review": "Code review experience",
  teamwork: "Team collaboration",
  collaboration: "Team collaboration",
  japanese: "Japanese workplace communication"
};

function canonicalize(value: string): string {
  const cleaned = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.。,:;!?]+$/g, "");
  const key = cleaned.toLowerCase();
  return canonicalTerms[key] ?? cleaned;
}

function topTerms(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const canonical = canonicalize(value);
    if (!canonical || canonical.toLowerCase() === "unknown") continue;
    counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function containsAny(value: string, keywords: string[]): boolean {
  const lower = value.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

export function buildRoleBaselines(
  signals: ExtractedHiringSignal[],
  sources: RawCareerSource[]
): RoleBaseline[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const grouped = new Map<string, ExtractedHiringSignal[]>();

  for (const signal of signals) {
    const country = sourceById.get(signal.sourceId)?.country ?? "Japan";
    const key = `${country}::${signal.role}`;
    grouped.set(key, [...(grouped.get(key) ?? []), signal]);
  }

  return [...grouped.entries()].map(([key, group]) => {
    const [country, role] = key.split("::") as [Country, string];
    const technicalPool = group.flatMap((signal) => [
      ...signal.requiredTechnicalSkills,
      ...signal.preferredTechnicalSkills
    ]);
    const communicationPool = group.flatMap((signal) => [
      signal.requiredLanguageLevel,
      ...signal.preferredSoftSkills,
      ...signal.successSignals,
      ...signal.commonInterviewQuestions
    ]);
    const softSkillPool = group.flatMap((signal) => [
      ...signal.preferredSoftSkills,
      ...signal.companyValues
    ]);
    const motivationPool = group.flatMap((signal) => [
      ...signal.companyValues,
      ...signal.commonConcerns.filter((value) => containsAny(value, ["motivation", "company", "product"])),
      ...signal.successSignals.filter((value) => containsAny(value, ["product", "business", "company"]))
    ]);
    const evidencePool = group.flatMap((signal) => signal.recommendedEvidence);
    const riskPool = group.flatMap((signal) => [
      ...signal.commonConcerns,
      ...signal.commonWeaknesses
    ]);

    const commonRisks = topTerms(riskPool, 8);
    const recommendedActivities = recommendBridgeLabs(
      topTerms(evidencePool, 8),
      commonRisks,
      role
    ).map((lab) => lab.activity);

    return {
      role,
      country,
      technicalBaseline: topTerms(technicalPool, 10),
      communicationBaseline: topTerms(communicationPool, 8),
      softSkillBaseline: topTerms(softSkillPool, 8),
      motivationBaseline: topTerms(motivationPool, 6),
      evidenceBaseline: topTerms(evidencePool, 10),
      commonRisks,
      recommendedActivities,
      sourceCount: group.length,
      updatedAt: new Date().toISOString()
    };
  });
}
