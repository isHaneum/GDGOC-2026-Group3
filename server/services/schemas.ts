const stringArray = {
  type: "array",
  items: { type: "string" }
};

const bridgeLabRecommendationSchema = {
  type: "object",
  properties: {
    activity: { type: "string" },
    reason: { type: "string" },
    expectedOutcome: { type: "string" },
    proofCreated: { type: "string" }
  },
  required: ["activity", "reason", "expectedOutcome", "proofCreated"]
};

export const extractedHiringSignalSchema = {
  type: "object",
  properties: {
    sourceId: { type: "string" },
    role: { type: "string" },
    requiredTechnicalSkills: stringArray,
    preferredTechnicalSkills: stringArray,
    requiredLanguageLevel: { type: "string" },
    preferredSoftSkills: stringArray,
    companyValues: stringArray,
    commonConcerns: stringArray,
    commonInterviewQuestions: stringArray,
    successSignals: stringArray,
    commonWeaknesses: stringArray,
    recommendedEvidence: stringArray,
    extractedSummary: { type: "string" }
  },
  required: [
    "sourceId",
    "role",
    "requiredTechnicalSkills",
    "preferredTechnicalSkills",
    "requiredLanguageLevel",
    "preferredSoftSkills",
    "companyValues",
    "commonConcerns",
    "commonInterviewQuestions",
    "successSignals",
    "commonWeaknesses",
    "recommendedEvidence",
    "extractedSummary"
  ]
};

export const gapAnalysisSchema = {
  type: "object",
  properties: {
    overallFitScore: { type: "number" },
    technicalFitScore: { type: "number" },
    communicationFitScore: { type: "number" },
    motivationFitScore: { type: "number" },
    collaborationEvidenceScore: { type: "number" },
    evidenceConfidenceScore: { type: "number" },
    matchedSignals: stringArray,
    missingSignals: stringArray,
    risks: stringArray,
    recruiterLensFeedback: stringArray,
    rewrittenSelfIntroduction: { type: "string" },
    suggestedTags: stringArray,
    recommendedActions: {
      type: "array",
      items: bridgeLabRecommendationSchema
    },
    recommendedBridgeLabs: {
      type: "array",
      items: bridgeLabRecommendationSchema
    },
    safetyNote: { type: "string" }
  },
  required: [
    "overallFitScore",
    "technicalFitScore",
    "communicationFitScore",
    "motivationFitScore",
    "collaborationEvidenceScore",
    "evidenceConfidenceScore",
    "matchedSignals",
    "missingSignals",
    "risks",
    "recruiterLensFeedback",
    "rewrittenSelfIntroduction",
    "suggestedTags",
    "recommendedActions",
    "recommendedBridgeLabs",
    "safetyNote"
  ]
};

export const recruiterLensSchema = {
  type: "object",
  properties: {
    originalSelfIntroduction: { type: "string" },
    rewrittenSelfIntroduction: { type: "string" },
    explanation: stringArray,
    missingElements: stringArray,
    safetyNote: { type: "string" }
  },
  required: [
    "originalSelfIntroduction",
    "rewrittenSelfIntroduction",
    "explanation",
    "missingElements",
    "safetyNote"
  ]
};
