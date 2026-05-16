import { evaluateCandidate } from "../../../../server/services/candidateEvaluator";
import { jsonError, jsonResponse } from "../../_lib/respond";
import type { CandidateProfileInput } from "../../../../shared/companyCriteriaTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvaluationPayload = {
  companyId: string;
  candidate: CandidateProfileInput;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EvaluationPayload;

    if (!payload.companyId || !payload.candidate?.candidateName || !payload.candidate?.resumeText) {
      throw new Error("companyId, candidateName, and resumeText are required.");
    }

    return jsonResponse(await evaluateCandidate(payload.candidate, payload.companyId));
  } catch (error) {
    return jsonError(error);
  }
}