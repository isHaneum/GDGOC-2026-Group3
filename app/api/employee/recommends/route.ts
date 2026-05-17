import { createClient, hasSupabaseEnv } from '../../../_lib/supabase'
import { buildEmployeeRecommendationsPayload } from '../../../../server/services/developerRecommendationService'
import { getEmployeeProfile } from '../../../../server/services/profileService'
import type { EmployeeRecommendationsResponse } from '../../../../shared/employeeRecommendations'
import { jsonError, jsonResponse } from '../../_lib/respond'

function unauthenticatedResponse(message?: string): EmployeeRecommendationsResponse {
  return {
    authenticated: false,
    developer: null,
    recommendations: [],
    companies: [],
    generatedAt: new Date().toISOString(),
    aiEvaluation: null,
    message,
  }
}

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse(unauthenticatedResponse('로그인 환경이 준비되지 않아 추천 직무를 불러올 수 없습니다.'))
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) {
      return jsonResponse(unauthenticatedResponse('로그인 후 추천 직무를 확인할 수 있습니다.'))
    }

    const data = await getEmployeeProfile(db, user.id)
    return jsonResponse(await buildEmployeeRecommendationsPayload(data))
  } catch (error) {
    return jsonError(error)
  }
}
