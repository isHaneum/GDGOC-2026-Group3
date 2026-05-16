import { extractSignalsPayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    return jsonResponse(await extractSignalsPayload(body.useGemini !== false));
  } catch (error) {
    return jsonError(error);
  }
}
