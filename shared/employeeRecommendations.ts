import type { CompanyJobProfile, DeveloperToCompanyFitResult } from "./companyCriteriaTypes";

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
  message?: string;
};