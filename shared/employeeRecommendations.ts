import type { CompanyJobProfile, DeveloperToCompanyFitResult } from "./companyCriteriaTypes";

export type EmployeeRecommendationsAiEvaluation = {
  geminiConfigured: boolean;
  evaluatedCompanyCount: number;
  geminiUsedCount: number;
  fallbackCount: number;
  message: string;
};

export type EmployeeRecommendationDeveloperSummary = {
  developerId: string;
  name: string;
  targetRoles: string[];
  yearsOfExperience: number;
  preferredLocations: string[];
};

export type EmployeeRecommendationsResponse = {
  authenticated: boolean;
  developer: EmployeeRecommendationDeveloperSummary | null;
  recommendations: DeveloperToCompanyFitResult[];
  companies: CompanyJobProfile[];
  generatedAt: string;
  aiEvaluation: EmployeeRecommendationsAiEvaluation | null;
  message?: string;
};