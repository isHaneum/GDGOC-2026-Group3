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

// ─── The Bridge: DB types ────────────────────────────────────────────────────

export interface DbProfile {
  id: number
  user_id: string  // uuid — references auth.users
  role: 'developer' | 'employer'
  market: 'KR' | 'JP'
  created_at: string
  updated_at: string
}

export interface DbDeveloperProfile {
  id: number
  profile_id: number
  full_name: string | null
  nationality: string | null
  target_country: string | null
  target_role: string | null
  tech_stack: string[]
  target_language_level: string | null
  portfolio_url: string | null
  github_url: string | null
  self_introduction: string | null
  key_project_experience: string | null
  created_at: string
  updated_at: string
}

export interface CvContent {
  name: string
  content: string
}

export interface DbCv {
  id: number
  developer_profile_id: number
  contents: CvContent[]
  created_at: string
  updated_at: string
}

export interface DbCategory {
  id: number
  name: string
  slug: string
  market: 'KR' | 'JP' | 'ALL'
  description: string | null
}

export interface DbPost {
  id: number
  author_id: number
  category_id: number
  title: string
  content: string
  like_count: number
  created_at: string
  updated_at: string
}

export interface DbComment {
  id: number
  post_id: number
  author_id: number
  content: string
  created_at: string
  updated_at: string
}

export interface PostWithMeta extends DbPost {
  author: Pick<DbProfile, 'id' | 'role' | 'market'>
  category: DbCategory
  comment_count: number
}

export interface PostWithComments extends PostWithMeta {
  comments: (DbComment & {
    author: Pick<DbProfile, 'id' | 'role' | 'market'>
  })[]
}

export interface DeveloperProfileFull {
  profile: DbProfile
  devProfile: DbDeveloperProfile
  cv: DbCv | null
}
