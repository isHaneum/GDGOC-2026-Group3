import type {
  CandidateEvaluationResult,
  CandidateEvaluationStatus,
  CandidateProfileInput
} from "../../shared/companyCriteriaTypes";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function evaluateCandidate(
  companyId: string,
  candidate: CandidateProfileInput
): Promise<CandidateEvaluationResult> {
  return fetchJson<CandidateEvaluationResult>("/api/candidate-evaluation/evaluate", {
    method: "POST",
    body: JSON.stringify({ companyId, candidate })
  });
}

export function getCandidateEvaluationStatus(): Promise<CandidateEvaluationStatus> {
  return fetchJson<CandidateEvaluationStatus>("/api/candidate-evaluation/status");
}