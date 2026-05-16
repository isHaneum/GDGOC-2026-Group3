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
}