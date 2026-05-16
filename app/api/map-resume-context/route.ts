import { ApiError, mapResumeContextPayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      throw new ApiError(400, "Request body must be valid JSON.");
    }

    return jsonResponse(await mapResumeContextPayload(payload));
  } catch (error) {
    return jsonError(error);
  }
}
