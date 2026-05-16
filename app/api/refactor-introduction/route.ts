import type { DeveloperProfile } from "../../../shared/types";
import { refactorIntroductionPayload } from "../../../server/services/apiHandlers";
import { jsonError, jsonResponse } from "../_lib/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as DeveloperProfile;
    return jsonResponse(await refactorIntroductionPayload(profile));
  } catch (error) {
    return jsonError(error);
  }
}
