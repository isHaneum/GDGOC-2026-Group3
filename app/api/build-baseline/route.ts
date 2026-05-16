import { buildBaselinePayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return jsonResponse(await buildBaselinePayload());
  } catch (error) {
    return jsonError(error);
  }
}
