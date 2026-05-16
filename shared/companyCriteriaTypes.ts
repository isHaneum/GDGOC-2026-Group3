export interface CompanyRubricCriterion {
  criterionName: string;
  weight: number;
  description: string;
  positiveEvidence: string[];
  riskSignals: string[];
  recommendedVerificationActivity: string[];
}

export interface CompanyEvaluationRubric {
  companyId: string;
  companyName: string;
  targetRole: string;
  totalWeight: number;
  criteria: CompanyRubricCriterion[];
  rubricSummary: string;
  generatedAt: string;
}

export interface CompanyHiringSignal {
  companyId: string;
  companyName: string;
  country: "Japan" | "Korea" | "Other";
  industry: string;
  roles: string[];
  requiredTechnicalSkills: string[];
  preferredTechnicalSkills: string[];
  languageExpectation: string[];
  workStyle: string[];
  companyValues: string[];
  preferredSoftSkills: string[];
  evaluationSignals: string[];
  riskConcerns: string[];
  recommendedCandidateEvidence: string[];
  extractedSummary: string;
  confidenceScore: number;
  sourceIds: string[];
}

export interface DeveloperLanguageCertification {
  language: "Japanese" | "Korean" | "English" | "Other";
  level: string;
  certification?: string;
}

export interface DeveloperPreference {
  developerId: string;
  name: string;
  nationality: "Korean" | "Japanese" | "Other";
  preferredSalaryMin?: number;
  preferredSalaryMax?: number;
  preferredCurrency: "JPY" | "KRW" | "USD";
  preferredLocations: string[];
  availableTechStacks: string[];
  languageCertifications: DeveloperLanguageCertification[];
  yearsOfExperience: number;
  targetRoles: string[];
  preferredCompanyTypes: string[];
  workStylePreference: "remote" | "hybrid" | "onsite" | "any";
  relocationAvailable: boolean;
  visaSupportNeeded?: boolean;
  resumeText: string;
  portfolioText?: string;
  motivation?: string;
  concerns?: string[];
}

export interface CompanyJobLanguageRequirement {
  language: string;
  level: string;
}

export interface CompanyExperienceRange {
  minYears?: number;
  maxYears?: number;
}

export interface CompanyJobProfile {
  companyId: string;
  companyName: string;
  roleId: string;
  roleTitle: string;
  country: "Japan" | "Korea" | "Other";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: "JPY" | "KRW" | "USD" | "unknown";
  locations: string[];
  requiredTechStacks: string[];
  preferredTechStacks: string[];
  requiredLanguages: CompanyJobLanguageRequirement[];
  preferredLanguages?: CompanyJobLanguageRequirement[];
  experienceRange: CompanyExperienceRange;
  workStyle: "remote" | "hybrid" | "onsite" | "unknown";
  companyType: string;
  roleCategory: "Frontend" | "Backend" | "Mobile" | "AI/ML" | "Cyber Security" | "Fullstack" | "Data" | "Other";
  rubricId: string;
  sourceConfidence: "high" | "medium" | "low" | "fallback";
  sourceUrls?: string[];
  notes?: string;
}

export interface EvidenceMission {
  missionId: string;
  title: string;
  category: "communication" | "collaboration" | "technical" | "motivation" | "language" | "portfolio";
  reason: string;
  expectedOutcome: string;
  proofCreated: string;
  recommendedFor: string[];
}

export interface DeveloperToCompanyScoreBreakdown {
  skillFit: number;
  roleFit: number;
  salaryFit: number;
  locationFit: number;
  languageFit: number;
  experienceFit: number;
  workStyleFit: number;
  rubricFit: number;
  evidenceConfidence: number;
}

export interface DeveloperToCompanyFitResult {
  developerId: string;
  companyId: string;
  companyName: string;
  roleId: string;
  roleTitle: string;
  overallFitScore: number;
  scoreBreakdown: DeveloperToCompanyScoreBreakdown;
  matchedReasons: string[];
  missingSignals: string[];
  risks: string[];
  recommendedMissions: EvidenceMission[];
  recommendedNextStep: "research_company" | "bridge_labs_activity" | "rewrite_motivation" | "casual_interview" | "trial_project" | "apply_now";
  explanation: string;
}

export interface CompanyToDeveloperScoreBreakdown {
  requiredSkillMatch: number;
  preferredSkillMatch: number;
  languageRequirementMatch: number;
  experienceLevelMatch: number;
  locationWorkstyleMatch: number;
  motivationMatch: number;
  rubricFit: number;
  evidenceConfidence: number;
}

export interface CompanyToDeveloperFitResult {
  companyId: string;
  companyName: string;
  roleId: string;
  roleTitle: string;
  developerId: string;
  developerName: string;
  overallFitScore: number;
  scoreBreakdown: CompanyToDeveloperScoreBreakdown;
  topMatchSignals: string[];
  missingSignals: string[];
  risks: string[];
  recommendedRecruiterAction: "save_candidate" | "request_passport" | "invite_office_tour" | "casual_interview" | "trial_project" | "recommend_bridge_labs";
  explanation: string;
}

export interface CompanyJobProfileValidationItem {
  companyId: string;
  companyName: string;
  roleId: string;
  warnings: string[];
}

export interface CompanyJobProfilesValidationSummary {
  totalProfiles: number;
  validProfiles: number;
  warningProfiles: number;
  invalidProfiles: number;
  warningsByCompany: CompanyJobProfileValidationItem[];
}

export interface FitEngineMetadata {
  name: string;
  version: string;
  generatedAt: string;
  companyJobProfileCount: number;
  sampleDeveloperProfileCount: number;
  source: string;
  intendedUse: string;
  safetyNote: string;
  limitations: string[];
  profileQualityPlan: string[];
}

export interface CandidateProfileInput {
  candidateName: string;
  targetRole?: string;
  resumeText: string;
  portfolioText?: string;
  githubSummary?: string;
  languageSkills?: string[];
  projectExperience?: string;
  selfIntroduction?: string;
  motivation?: string;
}

export interface CandidateCriterionScore {
  criterionName: string;
  weight: number;
  score: number;
  weightedScore: number;
  matchedEvidence: string[];
  missingEvidence: string[];
  riskSignals: string[];
  feedback: string;
}

export type CandidateEvaluationMode = "gemini" | "fallback";
export type GeminiKeySource = "env" | "file" | "none";

export interface CandidateEvaluationDebugInfo {
  geminiConfigured: boolean;
  geminiAttempted: boolean;
  geminiUsed: boolean;
  geminiModel: string | null;
  geminiKeySource: GeminiKeySource;
  fallbackReason?: string;
}

export interface CandidateEvaluationStatus {
  geminiConfigured: boolean;
  geminiModel: string;
  geminiKeySource: GeminiKeySource;
  rubricCount: number;
  companies: Array<Pick<CompanyEvaluationRubric, "companyId" | "companyName" | "targetRole">>;
}

export interface CandidateEvaluationResult {
  companyId: string;
  companyName: string;
  candidateName: string;
  targetRole: string;
  overallFitScore: number;
  criterionScores: CandidateCriterionScore[];
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommendedActions: string[];
  suggestedTags: string[];
  recruiterLensSummary: string;
  recommendedNextStep: "office_tour" | "casual_interview" | "trial_project" | "bridge_labs_activity" | "not_ready_yet";
  safetyNote: string;
  evaluationMode: CandidateEvaluationMode;
  debug: CandidateEvaluationDebugInfo;
}