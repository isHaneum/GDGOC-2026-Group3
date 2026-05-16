import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  CandidateCriterionScore,
  CandidateEvaluationResult,
  CandidateProfileInput,
  CompanyEvaluationRubric,
  CompanyRubricCriterion
} from "../../shared/companyCriteriaTypes";
import { generateGeminiJson, hasGeminiKey } from "./gemini";

type RawRubricCriterion = Omit<CompanyRubricCriterion, "recommendedVerificationActivity"> & {
  recommendedVerificationActivity: string | string[];
};

type RawRubric = Omit<CompanyEvaluationRubric, "criteria"> & {
  criteria: RawRubricCriterion[];
};

const companyRubricsPath = path.resolve(process.cwd(), "public/data/company-criteria/companyRubrics.json");
const nextStepValues = ["office_tour", "casual_interview", "trial_project", "bridge_labs_activity", "not_ready_yet"] as const;
const safetyNote =
  "This result is a recruiter guidance signal for demo purposes. It is not a hiring decision and must be reviewed by humans.";

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

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizePhrase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_/()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizePhrase(value)
      .split(/[^a-z0-9가-힣一-龥ぁ-んァ-ン]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );
}

function buildCandidateText(candidate: CandidateProfileInput): string {
  return [
    candidate.targetRole,
    candidate.resumeText,
    candidate.portfolioText,
    candidate.githubSummary,
    candidate.languageSkills?.join(" "),
    candidate.projectExperience,
    candidate.selfIntroduction,
    candidate.motivation
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function matchesEvidence(candidateText: string, candidateTokens: Set<string>, evidence: string): boolean {
  const normalizedEvidence = normalizePhrase(evidence);
  if (!normalizedEvidence) return false;
  if (candidateText.includes(normalizedEvidence)) return true;

  const evidenceTokens = [...tokenize(normalizedEvidence)];
  if (!evidenceTokens.length) return false;

  return evidenceTokens.every((token) => candidateTokens.has(token));
}

function normalizeNextStep(value: string): CandidateEvaluationResult["recommendedNextStep"] {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (nextStepValues.includes(normalized as CandidateEvaluationResult["recommendedNextStep"])
    ? normalized
    : "not_ready_yet") as CandidateEvaluationResult["recommendedNextStep"];
}

function buildFeedback(
  criterion: CompanyRubricCriterion,
  matchedEvidence: string[],
  missingEvidence: string[],
  matchedRisks: string[]
): string {
  const parts = [`${criterion.criterionName} was evaluated using company-specific evidence signals.`];

  if (matchedEvidence.length) {
    parts.push(`Matched evidence: ${matchedEvidence.join(", ")}.`);
  }

  if (missingEvidence.length) {
    parts.push(`Missing evidence: ${missingEvidence.slice(0, 3).join(", ")}.`);
  }

  if (matchedRisks.length) {
    parts.push(`Observed risk signals: ${matchedRisks.join(", ")}.`);
  }

  return parts.join(" ");
}

function recommendNextStep(overallFitScore: number, risks: string[]): CandidateEvaluationResult["recommendedNextStep"] {
  if (overallFitScore >= 85 && risks.length <= 1) return "casual_interview";
  if (overallFitScore >= 75) return "trial_project";
  if (overallFitScore >= 60) return "bridge_labs_activity";
  if (overallFitScore >= 45) return "office_tour";
  return "not_ready_yet";
}

function buildRecommendedActions(criterionScores: CandidateCriterionScore[]): string[] {
  const actions = criterionScores.flatMap((criterionScore) => [
    ...criterionScore.missingEvidence.map((evidence) => `Add concrete evidence for ${evidence}`),
    ...criterionScore.riskSignals.map((riskSignal) => `Prepare proof that addresses ${riskSignal}`)
  ]);

  return unique(actions).slice(0, 6);
}

function buildSuggestedTags(candidate: CandidateProfileInput, criterionScores: CandidateCriterionScore[]): string[] {
  const tags = criterionScores.flatMap((criterionScore) => criterionScore.matchedEvidence);
  if (candidate.targetRole) tags.push(candidate.targetRole);
  if (candidate.languageSkills) tags.push(...candidate.languageSkills);
  return unique(tags).slice(0, 8);
}

function buildRecruiterLensSummary(
  candidate: CandidateProfileInput,
  rubric: CompanyEvaluationRubric,
  overallFitScore: number,
  strengths: string[],
  gaps: string[]
): string {
  const strengthsText = strengths.length ? strengths.slice(0, 2).join(", ") : "limited verified evidence";
  const gapsText = gaps.length ? gaps.slice(0, 2).join(", ") : "no major gaps surfaced in fallback scoring";

  return `${candidate.candidateName} is being viewed through ${rubric.companyName}'s ${rubric.targetRole} lens. Overall fit is ${overallFitScore}/100, with strongest evidence in ${strengthsText} and biggest gaps in ${gapsText}.`;
}

function candidateEvaluationSchema() {
  return {
    type: "object",
    properties: {
      companyId: { type: "string" },
      companyName: { type: "string" },
      candidateName: { type: "string" },
      targetRole: { type: "string" },
      overallFitScore: { type: "number" },
      criterionScores: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterionName: { type: "string" },
            weight: { type: "number" },
            score: { type: "number" },
            weightedScore: { type: "number" },
            matchedEvidence: { type: "array", items: { type: "string" } },
            missingEvidence: { type: "array", items: { type: "string" } },
            riskSignals: { type: "array", items: { type: "string" } },
            feedback: { type: "string" }
          },
          required: ["criterionName", "weight", "score", "weightedScore", "matchedEvidence", "missingEvidence", "riskSignals", "feedback"]
        }
      },
      strengths: { type: "array", items: { type: "string" } },
      gaps: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      recommendedActions: { type: "array", items: { type: "string" } },
      suggestedTags: { type: "array", items: { type: "string" } },
      recruiterLensSummary: { type: "string" },
      recommendedNextStep: { type: "string" },
      safetyNote: { type: "string" }
    },
    required: [
      "companyId",
      "companyName",
      "candidateName",
      "targetRole",
      "overallFitScore",
      "criterionScores",
      "strengths",
      "gaps",
      "risks",
      "recommendedActions",
      "suggestedTags",
      "recruiterLensSummary",
      "recommendedNextStep",
      "safetyNote"
    ]
  };
}

function normalizeGeminiResult(
  candidate: CandidateProfileInput,
  rubric: CompanyEvaluationRubric,
  result: CandidateEvaluationResult
): CandidateEvaluationResult {
  const maxRawScore = result.criterionScores.reduce((max, item) => Math.max(max, item.score), 0);
  const scoreScaleMultiplier = maxRawScore > 0 && maxRawScore <= 5 ? 20 : 1;

  const criterionScores = rubric.criteria.map((criterion) => {
    const matched = result.criterionScores.find((item) => item.criterionName.toLowerCase() === criterion.criterionName.toLowerCase());

    if (!matched) {
      return {
        criterionName: criterion.criterionName,
        weight: criterion.weight,
        score: 50,
        weightedScore: round((50 * criterion.weight) / 100),
        matchedEvidence: [],
        missingEvidence: criterion.positiveEvidence,
        riskSignals: [],
        feedback: `${criterion.criterionName} was not explicitly scored by Gemini, so a neutral fallback score was used.`
      };
    }

    const score = clamp(matched.score * scoreScaleMultiplier, 0, 100);
    return {
      criterionName: criterion.criterionName,
      weight: criterion.weight,
      score: round(score),
      weightedScore: round((score * criterion.weight) / 100),
      matchedEvidence: unique(matched.matchedEvidence),
      missingEvidence: unique(matched.missingEvidence),
      riskSignals: unique(matched.riskSignals),
      feedback: matched.feedback
    } satisfies CandidateCriterionScore;
  });

  const overallFitScore = round(criterionScores.reduce((sum, item) => sum + item.weightedScore, 0));
  const strengths = unique(result.strengths).slice(0, 5);
  const gaps = unique(result.gaps).slice(0, 5);
  const risks = unique(result.risks).slice(0, 5);

  return {
    companyId: rubric.companyId,
    companyName: rubric.companyName,
    candidateName: candidate.candidateName,
    targetRole: result.targetRole || candidate.targetRole || rubric.targetRole,
    overallFitScore,
    criterionScores,
    strengths,
    gaps,
    risks,
    recommendedActions: unique(result.recommendedActions).slice(0, 6),
    suggestedTags: unique(result.suggestedTags).slice(0, 8),
    recruiterLensSummary:
      result.recruiterLensSummary || buildRecruiterLensSummary(candidate, rubric, overallFitScore, strengths, gaps),
    recommendedNextStep: normalizeNextStep(result.recommendedNextStep),
    safetyNote
  };
}

export async function loadCompanyRubricsNode(): Promise<CompanyEvaluationRubric[]> {
  const rawText = await readFile(companyRubricsPath, "utf8");
  const rubrics = JSON.parse(rawText) as RawRubric[];
  return rubrics.map(normalizeRubric);
}

export async function findCompanyRubric(companyId: string): Promise<CompanyEvaluationRubric> {
  const rubrics = await loadCompanyRubricsNode();
  const rubric = rubrics.find((item) => item.companyId === companyId);

  if (!rubric) {
    throw new Error(`Company rubric not found for companyId: ${companyId}`);
  }

  return rubric;
}

export function evaluateCandidateFallback(
  candidate: CandidateProfileInput,
  rubric: CompanyEvaluationRubric
): CandidateEvaluationResult {
  const candidateText = buildCandidateText(candidate);
  const candidateTokens = tokenize(candidateText);
  const isShortProfile = candidateText.replace(/\s+/g, " ").trim().length < 240;

  const criterionScores = rubric.criteria.map((criterion) => {
    const matchedEvidence = criterion.positiveEvidence.filter((evidence) => matchesEvidence(candidateText, candidateTokens, evidence));
    const missingEvidence = criterion.positiveEvidence.filter((evidence) => !matchedEvidence.includes(evidence));
    const matchedRisks = criterion.riskSignals.filter((riskSignal) => matchesEvidence(candidateText, candidateTokens, riskSignal));

    let score = 50;
    score += Math.min(matchedEvidence.length * 10, 40);
    score -= Math.min(matchedRisks.length * 10, 30);

    if (isShortProfile) {
      score = Math.min(score, 60);
    }

    score = clamp(score, 0, 100);

    return {
      criterionName: criterion.criterionName,
      weight: criterion.weight,
      score: round(score),
      weightedScore: round((score * criterion.weight) / 100),
      matchedEvidence,
      missingEvidence,
      riskSignals: matchedRisks,
      feedback: buildFeedback(criterion, matchedEvidence, missingEvidence, matchedRisks)
    } satisfies CandidateCriterionScore;
  });

  const overallFitScore = round(criterionScores.reduce((sum, item) => sum + item.weightedScore, 0));
  const strengths = unique(
    criterionScores
      .filter((item) => item.score >= 65 && item.matchedEvidence.length > 0)
      .flatMap((item) => item.matchedEvidence.map((evidence) => `${item.criterionName}: ${evidence}`))
  ).slice(0, 5);
  const gaps = unique(
    criterionScores.flatMap((item) => item.missingEvidence.map((evidence) => `${item.criterionName}: ${evidence}`))
  ).slice(0, 5);
  const risks = unique(
    criterionScores.flatMap((item) => item.riskSignals.map((riskSignal) => `${item.criterionName}: ${riskSignal}`))
  ).slice(0, 5);

  return {
    companyId: rubric.companyId,
    companyName: rubric.companyName,
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole ?? rubric.targetRole,
    overallFitScore,
    criterionScores,
    strengths,
    gaps,
    risks,
    recommendedActions: buildRecommendedActions(criterionScores),
    suggestedTags: buildSuggestedTags(candidate, criterionScores),
    recruiterLensSummary: buildRecruiterLensSummary(candidate, rubric, overallFitScore, strengths, gaps),
    recommendedNextStep: recommendNextStep(overallFitScore, risks),
    safetyNote
  };
}

export async function evaluateCandidateWithGemini(
  candidate: CandidateProfileInput,
  rubric: CompanyEvaluationRubric
): Promise<CandidateEvaluationResult | null> {
  if (!hasGeminiKey()) {
    return null;
  }

  try {
    const prompt = `You are helping a recruiter understand evidence. You are not making a hiring decision.
Evaluate the candidate only on work-readiness signals:
- technical relevance
- communication evidence
- collaboration evidence
- motivation specificity
- company-specific readiness
- evidence strength

Do not evaluate nationality, race, gender, age, protected traits, personality stereotypes, or cultural superiority/inferiority.
Return structured JSON only.

Rubric JSON:
${JSON.stringify(rubric, null, 2)}

Candidate JSON:
${JSON.stringify(candidate, null, 2)}`;

    const result = await generateGeminiJson<CandidateEvaluationResult>({
      prompt,
      schema: candidateEvaluationSchema(),
      temperature: 0.2
    });

    return normalizeGeminiResult(candidate, rubric, result);
  } catch {
    return null;
  }
}

export async function evaluateCandidate(
  candidate: CandidateProfileInput,
  companyId: string
): Promise<CandidateEvaluationResult> {
  const rubric = await findCompanyRubric(companyId);
  const geminiResult = await evaluateCandidateWithGemini(candidate, rubric);
  return geminiResult ?? evaluateCandidateFallback(candidate, rubric);
}