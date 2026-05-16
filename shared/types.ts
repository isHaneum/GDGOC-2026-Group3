import type { DeveloperLanguageCertification } from "./companyCriteriaTypes";
export type { DeveloperLanguageCertification };

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

export type ResumeContextLocale = "ko" | "ja";
export type ResumeDetectedLocale = ResumeContextLocale | "mixed" | "unknown";
export type ResumeContextConfidence = "high" | "medium" | "low";

export interface ResumeContextMappingContent {
  name: string;
  content: string;
}

export interface ResumeContextMappingRequest {
  targetLocale: ResumeContextLocale;
  contents: ResumeContextMappingContent[];
}

export interface ResumeContextNote {
  note: string;
  confidence: ResumeContextConfidence;
  basis?: string;
}

export interface ResumeContextMappedItem {
  name: string;
  mappedName: string;
  originalContent: string;
  mappedContent: string;
  detectedSourceLocale: ResumeDetectedLocale;
  contextNotes: ResumeContextNote[];
}

export interface ResumeContextMappingResult {
  id: string;
  createdAt: string;
  targetLocale: ResumeContextLocale;
  detectedSourceLocale: ResumeDetectedLocale;
  items: ResumeContextMappedItem[];
}

export interface ResumeContextMappingRecord {
  id: string;
  createdAt: string;
  request: ResumeContextMappingRequest;
  response: ResumeContextMappingResult;
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
  role: 'employee' | 'employer'
  market: 'KR_TO_JP' | 'JP_TO_KR'
  created_at: string
  updated_at: string
}

export interface DbEmployeeProfile {
  id: number
  profile_id: number
  full_name: string
  birth_date: string
  gender: 'male' | 'female'
  nationality: 'korean' | 'japanese'
  years_of_experience: number
  target_roles: string[]
  tech_stack: string[]
  language_certifications: string
  preferred_salary_min: number
  preferred_salary_max: number
  preferred_currency: 'JPY' | 'KRW'
  preferred_locations: string[]
  preferred_company_types: string[]
  work_style_preference: 'remote' | 'hybrid' | 'onsite' | 'any'
  relocation_available: boolean
  visa_support_needed: boolean
  self_introduction: string
  key_project_experience: string
  motivation: string
  concerns: string
  github_url: string
  created_at: string
  updated_at: string
}

export type DbDeveloperProfile = DbEmployeeProfile

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
  image_url: string | null
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

type AuthorWithName = Pick<DbProfile, 'id' | 'role' | 'market'> & {
  developer_profiles: Array<{ full_name: string | null }>
}

export interface PostWithComments extends DbPost {
  author: AuthorWithName
  category: DbCategory
  comment_count: number
  comments: (DbComment & { author: AuthorWithName })[]
}

export interface EmployeeProfileFull {
  profile: DbProfile
  employeeProfile: DbEmployeeProfile
  cv?: DbCv | null
}

export type DeveloperProfileFull = EmployeeProfileFull
