import { getHealthPayload } from "../../../server/services/apiHandlers";
import { jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse(getHealthPayload());
}
