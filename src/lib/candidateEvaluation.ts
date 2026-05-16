import type { CandidateEvaluationResult, CandidateProfileInput } from "../../shared/companyCriteriaTypes";

export async function evaluateCandidate(
  companyId: string,
  candidate: CandidateProfileInput
): Promise<CandidateEvaluationResult> {
  const response = await fetch("/api/candidate-evaluation/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ companyId, candidate })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Failed to evaluate candidate");
  }

  return response.json() as Promise<CandidateEvaluationResult>;
}