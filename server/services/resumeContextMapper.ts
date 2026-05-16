import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ResumeContextConfidence,
  ResumeContextMappedItem,
  ResumeContextMappingRequest,
  ResumeContextMappingResult,
  ResumeContextPortfolioFieldKey,
  ResumeContextSourceLocaleHint,
  ResumeDetectedLocale
} from "../../shared/types";
import { generateGeminiJson, hasGeminiKey } from "./gemini";
import { resumeContextMappingSchema } from "./schemas";
import { supabaseServer } from "./supabase";

const MAX_ARRAY_ITEMS = 30;
const MAX_FIELD_VALUE_LENGTH = 4000;
const MAX_TOTAL_FIELD_VALUE_LENGTH = 40000;
const PROMPT_PATH = path.join(process.cwd(), "server/prompts/resume-context-mapping.md");

const detectedLocales = new Set<ResumeDetectedLocale>(["ko", "ja", "mixed", "unknown"]);
const sourceLocaleHints = new Set<ResumeContextSourceLocaleHint>(["ko", "ja", "unknown"]);
const confidenceLevels = new Set<ResumeContextConfidence>(["high", "medium", "low"]);
const fieldKeys = new Set<ResumeContextPortfolioFieldKey>([
  "name",
  "nationality",
  "yearsOfExperience",
  "targetRoles",
  "techStack",
  "languageCertifications",
  "preferredSalary",
  "preferredLocations",
  "preferredCompanyTypes",
  "workStylePreference",
  "relocationAvailable",
  "visaSupportNeeded",
  "selfIntroduction",
  "keyProjectExperience",
  "motivation",
  "concerns",
  "githubUrl"
]);

type ValidationResult =
  | { ok: true; value: ResumeContextMappingRequest }
  | { ok: false; message: string };

type ResumeContextField = {
  fieldKey: ResumeContextPortfolioFieldKey;
  label: string;
  value: string;
};

interface GeminiResumeContextNote {
  note?: unknown;
  confidence?: unknown;
  basis?: unknown;
}

interface GeminiResumeContextItem {
  fieldKey?: unknown;
  mappedLabel?: unknown;
  mappedValue?: unknown;
  detectedSourceLocale?: unknown;
  contextNotes?: unknown;
}

interface GeminiResumeContextResult {
  detectedSourceLocale?: unknown;
  items?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDetectedLocale(value: unknown): value is ResumeDetectedLocale {
  return typeof value === "string" && detectedLocales.has(value as ResumeDetectedLocale);
}

function isSourceLocaleHint(value: unknown): value is ResumeContextSourceLocaleHint {
  return typeof value === "string" && sourceLocaleHints.has(value as ResumeContextSourceLocaleHint);
}

function isFieldKey(value: unknown): value is ResumeContextPortfolioFieldKey {
  return typeof value === "string" && fieldKeys.has(value as ResumeContextPortfolioFieldKey);
}

function isConfidence(value: unknown): value is ResumeContextConfidence {
  return typeof value === "string" && confidenceLevels.has(value as ResumeContextConfidence);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateTextLength(value: string, pathName: string): ValidationResult | null {
  if (value.length > MAX_FIELD_VALUE_LENGTH) {
    return {
      ok: false,
      message: `${pathName} must be ${MAX_FIELD_VALUE_LENGTH} characters or less.`
    };
  }

  return null;
}

function validateStringArray(
  value: unknown,
  pathName: string,
  options: { allowEmpty?: boolean } = {}
): string[] | ValidationResult {
  if (!Array.isArray(value)) {
    return { ok: false, message: `${pathName} must be an array.` };
  }

  if (!options.allowEmpty && value.length < 1) {
    return { ok: false, message: `${pathName} must contain at least 1 item.` };
  }

  if (value.length > MAX_ARRAY_ITEMS) {
    return { ok: false, message: `${pathName} must contain ${MAX_ARRAY_ITEMS} items or fewer.` };
  }

  const normalized: string[] = [];
  for (const [index, item] of value.entries()) {
    if (!nonEmptyString(item)) {
      return { ok: false, message: `${pathName}[${index}] must be a non-empty string.` };
    }

    const trimmed = item.trim();
    const lengthError = validateTextLength(trimmed, `${pathName}[${index}]`);
    if (lengthError) return lengthError;
    normalized.push(trimmed);
  }

  return normalized;
}

function validateRequiredString(value: unknown, pathName: string): string | ValidationResult {
  if (!nonEmptyString(value)) {
    return { ok: false, message: `${pathName} must be a non-empty string.` };
  }

  const trimmed = value.trim();
  const lengthError = validateTextLength(trimmed, pathName);
  if (lengthError) return lengthError;
  return trimmed;
}

function validateOptionalString(value: unknown, pathName: string): string | ValidationResult {
  const trimmed = optionalString(value);
  const lengthError = validateTextLength(trimmed, pathName);
  if (lengthError) return lengthError;
  return trimmed;
}

function isValidationError<T>(value: T | ValidationResult): value is ValidationResult {
  return isRecord(value) && value.ok === false && typeof value.message === "string";
}

function formatList(values: string[]) {
  return values.length ? values.join(", ") : "Not specified";
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

export function buildResumeContextFields(request: ResumeContextMappingRequest): ResumeContextField[] {
  return [
    { fieldKey: "name", label: "Name", value: request.applicant.name },
    { fieldKey: "nationality", label: "Nationality", value: request.applicant.nationality },
    {
      fieldKey: "yearsOfExperience",
      label: "Years of Experience",
      value: `${request.applicant.yearsOfExperience}`
    },
    { fieldKey: "targetRoles", label: "Target Roles", value: formatList(request.applicant.targetRoles) },
    { fieldKey: "techStack", label: "Core Tech Stack", value: formatList(request.portfolio.techStack) },
    {
      fieldKey: "languageCertifications",
      label: "Language Certifications",
      value: formatList(request.portfolio.languageCertifications)
    },
    {
      fieldKey: "preferredSalary",
      label: "Preferred Salary",
      value: request.portfolio.preferredSalary || "Not specified"
    },
    {
      fieldKey: "preferredLocations",
      label: "Preferred Locations",
      value: formatList(request.portfolio.preferredLocations)
    },
    {
      fieldKey: "preferredCompanyTypes",
      label: "Preferred Company Types",
      value: formatList(request.portfolio.preferredCompanyTypes)
    },
    {
      fieldKey: "workStylePreference",
      label: "Work Style Preference",
      value: request.portfolio.workStylePreference
    },
    {
      fieldKey: "relocationAvailable",
      label: "Relocation Available",
      value: formatBoolean(request.portfolio.relocationAvailable)
    },
    {
      fieldKey: "visaSupportNeeded",
      label: "Visa Support Needed",
      value: formatBoolean(request.portfolio.visaSupportNeeded)
    },
    {
      fieldKey: "selfIntroduction",
      label: "Self Introduction",
      value: request.portfolio.selfIntroduction || "Not specified"
    },
    {
      fieldKey: "keyProjectExperience",
      label: "Key Project Experience",
      value: request.portfolio.keyProjectExperience || "Not specified"
    },
    { fieldKey: "motivation", label: "Motivation", value: request.portfolio.motivation || "Not specified" },
    { fieldKey: "concerns", label: "Recruiter Concerns", value: formatList(request.portfolio.concerns) },
    { fieldKey: "githubUrl", label: "GitHub URL", value: request.portfolio.githubUrl || "Not specified" }
  ];
}

export function validateResumeContextMappingRequest(payload: unknown): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  if (payload.targetLocale !== "ko" && payload.targetLocale !== "ja") {
    return { ok: false, message: "targetLocale must be either 'ko' or 'ja'." };
  }

  if (!isSourceLocaleHint(payload.sourceLocaleHint)) {
    return { ok: false, message: "sourceLocaleHint must be 'ko', 'ja', or 'unknown'." };
  }

  if (!isRecord(payload.applicant)) {
    return { ok: false, message: "applicant must be an object." };
  }

  if (!isRecord(payload.portfolio)) {
    return { ok: false, message: "portfolio must be an object." };
  }

  const applicantId = validateRequiredString(payload.applicant.applicantId, "applicant.applicantId");
  if (isValidationError(applicantId)) return applicantId;

  const name = validateRequiredString(payload.applicant.name, "applicant.name");
  if (isValidationError(name)) return name;

  if (
    payload.applicant.nationality !== "Korean" &&
    payload.applicant.nationality !== "Japanese" &&
    payload.applicant.nationality !== "Other"
  ) {
    return { ok: false, message: "applicant.nationality must be 'Korean', 'Japanese', or 'Other'." };
  }

  if (
    typeof payload.applicant.yearsOfExperience !== "number" ||
    !Number.isFinite(payload.applicant.yearsOfExperience) ||
    payload.applicant.yearsOfExperience < 0
  ) {
    return { ok: false, message: "applicant.yearsOfExperience must be a non-negative number." };
  }

  if (
    payload.applicant.employeeProfileId !== undefined &&
    (typeof payload.applicant.employeeProfileId !== "number" ||
      !Number.isInteger(payload.applicant.employeeProfileId) ||
      payload.applicant.employeeProfileId < 1)
  ) {
    return { ok: false, message: "applicant.employeeProfileId must be a positive integer when provided." };
  }

  const targetRoles = validateStringArray(payload.applicant.targetRoles, "applicant.targetRoles");
  if (isValidationError(targetRoles)) return targetRoles;

  const techStack = validateStringArray(payload.portfolio.techStack, "portfolio.techStack");
  if (isValidationError(techStack)) return techStack;

  const languageCertifications = validateStringArray(
    payload.portfolio.languageCertifications,
    "portfolio.languageCertifications",
    { allowEmpty: true }
  );
  if (isValidationError(languageCertifications)) return languageCertifications;

  const preferredSalary = validateOptionalString(payload.portfolio.preferredSalary, "portfolio.preferredSalary");
  if (isValidationError(preferredSalary)) return preferredSalary;

  const preferredLocations = validateStringArray(payload.portfolio.preferredLocations, "portfolio.preferredLocations");
  if (isValidationError(preferredLocations)) return preferredLocations;

  const preferredCompanyTypes = validateStringArray(
    payload.portfolio.preferredCompanyTypes,
    "portfolio.preferredCompanyTypes"
  );
  if (isValidationError(preferredCompanyTypes)) return preferredCompanyTypes;

  if (
    payload.portfolio.workStylePreference !== "remote" &&
    payload.portfolio.workStylePreference !== "hybrid" &&
    payload.portfolio.workStylePreference !== "onsite" &&
    payload.portfolio.workStylePreference !== "any"
  ) {
    return {
      ok: false,
      message: "portfolio.workStylePreference must be 'remote', 'hybrid', 'onsite', or 'any'."
    };
  }

  if (typeof payload.portfolio.relocationAvailable !== "boolean") {
    return { ok: false, message: "portfolio.relocationAvailable must be a boolean." };
  }

  if (typeof payload.portfolio.visaSupportNeeded !== "boolean") {
    return { ok: false, message: "portfolio.visaSupportNeeded must be a boolean." };
  }

  const selfIntroduction = validateOptionalString(
    payload.portfolio.selfIntroduction,
    "portfolio.selfIntroduction"
  );
  if (isValidationError(selfIntroduction)) return selfIntroduction;

  const keyProjectExperience = validateOptionalString(
    payload.portfolio.keyProjectExperience,
    "portfolio.keyProjectExperience"
  );
  if (isValidationError(keyProjectExperience)) return keyProjectExperience;

  const motivation = validateOptionalString(payload.portfolio.motivation, "portfolio.motivation");
  if (isValidationError(motivation)) return motivation;

  const concerns = validateStringArray(payload.portfolio.concerns, "portfolio.concerns", { allowEmpty: true });
  if (isValidationError(concerns)) return concerns;

  const githubUrl = validateOptionalString(payload.portfolio.githubUrl, "portfolio.githubUrl");
  if (isValidationError(githubUrl)) return githubUrl;

  const request: ResumeContextMappingRequest = {
    targetLocale: payload.targetLocale,
    sourceLocaleHint: payload.sourceLocaleHint,
    applicant: {
      applicantId,
      ...(payload.applicant.employeeProfileId !== undefined
        ? { employeeProfileId: payload.applicant.employeeProfileId }
        : {}),
      name,
      nationality: payload.applicant.nationality,
      yearsOfExperience: payload.applicant.yearsOfExperience,
      targetRoles
    },
    portfolio: {
      techStack,
      languageCertifications,
      preferredSalary,
      preferredLocations,
      preferredCompanyTypes,
      workStylePreference: payload.portfolio.workStylePreference,
      relocationAvailable: payload.portfolio.relocationAvailable,
      visaSupportNeeded: payload.portfolio.visaSupportNeeded,
      selfIntroduction,
      keyProjectExperience,
      motivation,
      concerns,
      githubUrl
    }
  };

  const totalFieldValueLength = buildResumeContextFields(request).reduce(
    (sum, field) => sum + field.value.length,
    0
  );

  if (totalFieldValueLength > MAX_TOTAL_FIELD_VALUE_LENGTH) {
    return {
      ok: false,
      message: `Portfolio text must be ${MAX_TOTAL_FIELD_VALUE_LENGTH} characters or less in total.`
    };
  }

  return { ok: true, value: request };
}

async function buildPrompt(request: ResumeContextMappingRequest): Promise<string> {
  const template = await readFile(PROMPT_PATH, "utf-8");
  const fields = buildResumeContextFields(request);

  return `${template.trim()}

Target locale:
${request.targetLocale}

Source locale hint:
${request.sourceLocaleHint}

Applicant portfolio request:
${JSON.stringify(request, null, 2)}

Stable fields to map:
${JSON.stringify(fields, null, 2)}

Return only valid JSON matching the response schema.`;
}

function normalizeNote(note: GeminiResumeContextNote, itemIndex: number, noteIndex: number) {
  if (!nonEmptyString(note.note)) {
    throw new Error(`Gemini response item ${itemIndex} note ${noteIndex} is missing note.`);
  }

  if (!isConfidence(note.confidence)) {
    throw new Error(`Gemini response item ${itemIndex} note ${noteIndex} has invalid confidence.`);
  }

  return {
    note: note.note.trim(),
    confidence: note.confidence,
    ...(nonEmptyString(note.basis) ? { basis: note.basis.trim() } : {})
  };
}

function normalizeItem(
  item: GeminiResumeContextItem,
  original: ResumeContextField,
  index: number
): ResumeContextMappedItem {
  if (!isFieldKey(item.fieldKey)) {
    throw new Error(`Gemini response item ${index} has invalid fieldKey.`);
  }

  if (item.fieldKey !== original.fieldKey) {
    throw new Error(`Gemini response item ${index} fieldKey must match the requested field order.`);
  }

  if (!nonEmptyString(item.mappedLabel)) {
    throw new Error(`Gemini response item ${index} is missing mappedLabel.`);
  }

  if (!nonEmptyString(item.mappedValue)) {
    throw new Error(`Gemini response item ${index} is missing mappedValue.`);
  }

  if (!isDetectedLocale(item.detectedSourceLocale)) {
    throw new Error(`Gemini response item ${index} has invalid detectedSourceLocale.`);
  }

  if (!Array.isArray(item.contextNotes)) {
    throw new Error(`Gemini response item ${index} must include contextNotes.`);
  }

  return {
    fieldKey: original.fieldKey,
    label: original.label,
    mappedLabel: item.mappedLabel.trim(),
    originalValue: original.value,
    mappedValue: item.mappedValue.trim(),
    detectedSourceLocale: item.detectedSourceLocale,
    contextNotes: item.contextNotes.map((note, noteIndex) => {
      if (!isRecord(note)) {
        throw new Error(`Gemini response item ${index} note ${noteIndex} must be an object.`);
      }
      return normalizeNote(note, index, noteIndex);
    })
  };
}

export function normalizeGeminiResumeContextResult(
  geminiResult: GeminiResumeContextResult,
  request: ResumeContextMappingRequest,
  id: string,
  createdAt: string
): ResumeContextMappingResult {
  if (!isDetectedLocale(geminiResult.detectedSourceLocale)) {
    throw new Error("Gemini response has invalid detectedSourceLocale.");
  }

  if (!Array.isArray(geminiResult.items)) {
    throw new Error("Gemini response must include items.");
  }

  const fields = buildResumeContextFields(request);
  if (geminiResult.items.length !== fields.length) {
    throw new Error("Gemini response item count must match portfolio field count.");
  }

  return {
    id,
    createdAt,
    targetLocale: request.targetLocale,
    detectedSourceLocale: geminiResult.detectedSourceLocale,
    items: geminiResult.items.map((item, index) => {
      if (!isRecord(item)) {
        throw new Error(`Gemini response item ${index} must be an object.`);
      }
      return normalizeItem(item, fields[index], index);
    })
  };
}

export async function mapResumeContext(
  request: ResumeContextMappingRequest
): Promise<ResumeContextMappingResult> {
  if (!hasGeminiKey()) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!supabaseServer) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to persist resume context mappings.");
  }

  const geminiResult = await generateGeminiJson<GeminiResumeContextResult>({
    prompt: await buildPrompt(request),
    schema: resumeContextMappingSchema,
    temperature: 0.2
  });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const response = normalizeGeminiResumeContextResult(geminiResult, request, id, createdAt);

  const { error } = await supabaseServer.from("resume_context_mappings").insert({
    id,
    employee_profile_id: request.applicant.employeeProfileId ?? null,
    target_locale: request.targetLocale,
    detected_source_locale: response.detectedSourceLocale,
    request,
    response
  });

  if (error) {
    throw new Error(`Failed to persist resume context mapping: ${error.message}`);
  }

  return response;
}
