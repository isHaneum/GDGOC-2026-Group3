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
    message,
  }
}

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return jsonResponse(unauthenticatedResponse('Recommendation login environment is not configured.'))
    }

    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) {
      return jsonResponse(unauthenticatedResponse('Sign in to view recommended roles.'))
    }

    const data = await getEmployeeProfile(db, user.id)
    return jsonResponse(buildEmployeeRecommendationsPayload(data))
  } catch (error) {
    return jsonError(error)
  }
}
