import { jsonError, jsonResponse } from "../../_lib/respond";
import { loadCompanyRubricsNode } from "../../../../server/services/candidateEvaluator";
import { getGeminiConfiguration } from "../../../../server/services/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configuration = getGeminiConfiguration();
    const rubrics = await loadCompanyRubricsNode();

    return jsonResponse({
      geminiConfigured: configuration.configured,
      geminiModel: configuration.model,
      geminiKeySource: configuration.keySource,
      rubricCount: rubrics.length,
      companies: rubrics.map((rubric) => ({
        companyId: rubric.companyId,
        companyName: rubric.companyName,
        targetRole: rubric.targetRole
      }))
    });
  } catch (error) {
    return jsonError(error);
  }
}