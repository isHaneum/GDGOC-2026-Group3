import { getSampleSourcesPayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonResponse(await getSampleSourcesPayload());
  } catch (error) {
    return jsonError(error);
  }
}
