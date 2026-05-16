export type SourceType = "job_posting" | "career_review" | "community_post";
export type Country = "Japan" | "Korea";
export type Locale = "en" | "ko" | "ja";

export interface RawCareerSource {
  id: string;
  sourceType: SourceType;
  country: Country;
  role: string;
  industry: string;
  title: string;
  summaryText: string;
  url?: string;
  language: string;
  createdAt: string;
}

export interface ExtractedHiringSignal {
  sourceId: string;
  role: string;
  requiredTechnicalSkills: string[];
  preferredTechnicalSkills: string[];
  requiredLanguageLevel: string;
  preferredSoftSkills: string[];
  companyValues: string[];
  commonConcerns: string[];
  commonInterviewQuestions: string[];
  successSignals: string[];
  commonWeaknesses: string[];
  recommendedEvidence: string[];
  extractedSummary: string;
}

export interface RoleBaseline {
  role: string;
  country: Country;
  technicalBaseline: string[];
  communicationBaseline: string[];
  softSkillBaseline: string[];
  motivationBaseline: string[];
  evidenceBaseline: string[];
  commonRisks: string[];
  recommendedActivities: string[];
  sourceCount: number;
  updatedAt: string;
}

export interface DeveloperProfile {
  name: string;
  nationality: string;
  targetCountry: Country;
  targetRole: string;
  techStack: string;
  languageLevels: string;
  projectExperience: string;
  selfIntroduction: string;
  motivation: string;
  anxiety: string;
  uiLocale?: Locale;
}

export interface BridgeLabRecommendation {
  activity: string;
  reason: string;
  expectedOutcome: string;
  proofCreated: string;
}

export interface GapAnalysisResult {
  overallFitScore: number;
  technicalFitScore: number;
  communicationFitScore: number;
  motivationFitScore: number;
  collaborationEvidenceScore: number;
  evidenceConfidenceScore: number;
  matchedSignals: string[];
  missingSignals: string[];
  risks: string[];
  recruiterLensFeedback: string[];
  rewrittenSelfIntroduction: string;
  suggestedTags: string[];
  recommendedActions: BridgeLabRecommendation[];
  recommendedBridgeLabs: BridgeLabRecommendation[];
  safetyNote: string;
}

export interface RecruiterLensResult {
  originalSelfIntroduction: string;
  rewrittenSelfIntroduction: string;
  explanation: string[];
  missingElements: string[];
  safetyNote: string;
}

export interface CareerSignalState {
  sources: RawCareerSource[];
  signals: ExtractedHiringSignal[];
  baselines: RoleBaseline[];
}
