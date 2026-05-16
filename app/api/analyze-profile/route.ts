import type { DeveloperProfile } from "../../../shared/types";
import { analyzeProfilePayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as DeveloperProfile;
    return jsonResponse(await analyzeProfilePayload(profile));
  } catch (error) {
    return jsonError(error);
  }
}
