# Resume Context Mapping API

## Purpose

`POST /api/map-resume-context` maps an employer-visible applicant portfolio into recruiter-facing context for the opposite KR/JP hiring culture. It is not a literal translation endpoint. The API preserves applicant facts, adapts portfolio labels and values, and explains cultural or hiring-context interpretations with confidence levels.

The API is now portfolio-specific. The old generic `contents[]` request shape is intentionally rejected.

## Request

```ts
type ResumeContextLocale = "ko" | "ja";
type ResumeContextSourceLocaleHint = "ko" | "ja" | "unknown";

interface ResumeContextMappingRequest {
  targetLocale: ResumeContextLocale;
  sourceLocaleHint: ResumeContextSourceLocaleHint;
  applicant: {
    applicantId: string;
    employeeProfileId?: number;
    name: string;
    nationality: "Korean" | "Japanese" | "Other";
    yearsOfExperience: number;
    targetRoles: string[];
  };
  portfolio: {
    techStack: string[];
    languageCertifications: string[];
    preferredSalary: string;
    preferredLocations: string[];
    preferredCompanyTypes: string[];
    workStylePreference: "remote" | "hybrid" | "onsite" | "any";
    relocationAvailable: boolean;
    visaSupportNeeded: boolean;
    selfIntroduction: string;
    keyProjectExperience: string;
    motivation: string;
    concerns: string[];
    githubUrl: string;
  };
}
```

`birthDate` and `gender` must not be sent to this API, even if they exist in the profile database or UI.

## Response

```ts
type ResumeDetectedLocale = "ko" | "ja" | "mixed" | "unknown";
type ResumeContextConfidence = "high" | "medium" | "low";

interface ResumeContextMappedItem {
  fieldKey: string;
  label: string;
  mappedLabel: string;
  originalValue: string;
  mappedValue: string;
  detectedSourceLocale: ResumeDetectedLocale;
  contextNotes: {
    note: string;
    confidence: ResumeContextConfidence;
    basis?: string;
  }[];
}

interface ResumeContextMappingResult {
  id: string;
  createdAt: string;
  targetLocale: "ko" | "ja";
  detectedSourceLocale: ResumeDetectedLocale;
  items: ResumeContextMappedItem[];
}
```

The service flattens the structured portfolio into a stable ordered field list before prompting Gemini. Gemini must return one item per field in the same order.

## Failure And Persistence

- Invalid request bodies return `400`.
- Missing `GEMINI_API_KEY`, Gemini failure, malformed Gemini JSON, invalid normalized output, missing Supabase service role, or persistence failure returns `503`.
- Successful API response means the result was persisted.
- Successful records are written to Supabase `resume_context_mappings`, linked by `employee_profile_id` when available.
- Failed requests and partial outputs are not persisted.

## Frontend Integration

The employer applicant portfolio route `/employer/applicants/[applicantId]/portfolio` renders a client-side `ResumeContextMappingPanel`.

- The panel builds the request from the visible applicant portfolio and current market direction.
- `kr-jp` maps to `targetLocale: "ja"`.
- `jp-kr` maps to `targetLocale: "ko"`.
- Mapping runs only after the recruiter presses the button.
- The UI shows a blocked state for AI or persistence failure and does not fall back to mock results.

## Implementation Files

- `shared/types.ts`: portfolio-specific API contract.
- `server/services/resumeContextMapper.ts`: validation, field flattening, prompt assembly, Gemini normalization, Supabase persistence.
- `server/prompts/resume-context-mapping.md`: editable mapping prompt.
- `server/services/schemas.ts`: Gemini JSON response schema.
- `src/lib/applicantProfiles.ts`: Supabase-only applicant loading and formatting.
- `src/components/ResumeContextMappingPanel.tsx`: employer portfolio AI trigger and result renderer.
