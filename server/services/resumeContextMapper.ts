import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ResumeContextConfidence,
  ResumeContextMappedItem,
  ResumeContextMappingRequest,
  ResumeContextMappingResult,
  ResumeDetectedLocale
} from "../../shared/types";
import { generateGeminiJson, hasGeminiKey } from "./gemini";
import { resumeContextMappingSchema } from "./schemas";
import { supabaseServer } from "./supabase";

const MAX_CONTENT_ITEMS = 30;
const MAX_ITEM_CONTENT_LENGTH = 4000;
const MAX_TOTAL_CONTENT_LENGTH = 40000;
const PROMPT_PATH = path.join(process.cwd(), "server/prompts/resume-context-mapping.md");

const detectedLocales = new Set<ResumeDetectedLocale>(["ko", "ja", "mixed", "unknown"]);
const confidenceLevels = new Set<ResumeContextConfidence>(["high", "medium", "low"]);

type ValidationResult =
  | { ok: true; value: ResumeContextMappingRequest }
  | { ok: false; message: string };

interface GeminiResumeContextNote {
  note?: unknown;
  confidence?: unknown;
  basis?: unknown;
}

interface GeminiResumeContextItem {
  mappedName?: unknown;
  mappedContent?: unknown;
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

function isConfidence(value: unknown): value is ResumeContextConfidence {
  return typeof value === "string" && confidenceLevels.has(value as ResumeContextConfidence);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateResumeContextMappingRequest(payload: unknown): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  if (payload.targetLocale !== "ko" && payload.targetLocale !== "ja") {
    return { ok: false, message: "targetLocale must be either 'ko' or 'ja'." };
  }

  if (!Array.isArray(payload.contents)) {
    return { ok: false, message: "contents must be an array." };
  }

  if (payload.contents.length < 1 || payload.contents.length > MAX_CONTENT_ITEMS) {
    return { ok: false, message: `contents must contain 1 to ${MAX_CONTENT_ITEMS} items.` };
  }

  let totalContentLength = 0;
  const contents = [];

  for (const [index, item] of payload.contents.entries()) {
    if (!isRecord(item)) {
      return { ok: false, message: `contents[${index}] must be an object.` };
    }

    if (!nonEmptyString(item.name)) {
      return { ok: false, message: `contents[${index}].name must be a non-empty string.` };
    }

    if (!nonEmptyString(item.content)) {
      return { ok: false, message: `contents[${index}].content must be a non-empty string.` };
    }

    if (item.content.length > MAX_ITEM_CONTENT_LENGTH) {
      return {
        ok: false,
        message: `contents[${index}].content must be ${MAX_ITEM_CONTENT_LENGTH} characters or less.`
      };
    }

    totalContentLength += item.content.length;
    contents.push({
      name: item.name.trim(),
      content: item.content.trim()
    });
  }

  if (totalContentLength > MAX_TOTAL_CONTENT_LENGTH) {
    return {
      ok: false,
      message: `Total content length must be ${MAX_TOTAL_CONTENT_LENGTH} characters or less.`
    };
  }

  return {
    ok: true,
    value: {
      targetLocale: payload.targetLocale,
      contents
    }
  };
}

async function buildPrompt(request: ResumeContextMappingRequest): Promise<string> {
  const template = await readFile(PROMPT_PATH, "utf-8");
  return `${template.trim()}

Target locale:
${request.targetLocale}

Resume payload:
${JSON.stringify(request, null, 2)}

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
  original: ResumeContextMappingRequest["contents"][number],
  index: number
): ResumeContextMappedItem {
  if (!nonEmptyString(item.mappedName)) {
    throw new Error(`Gemini response item ${index} is missing mappedName.`);
  }

  if (!nonEmptyString(item.mappedContent)) {
    throw new Error(`Gemini response item ${index} is missing mappedContent.`);
  }

  if (!isDetectedLocale(item.detectedSourceLocale)) {
    throw new Error(`Gemini response item ${index} has invalid detectedSourceLocale.`);
  }

  if (!Array.isArray(item.contextNotes)) {
    throw new Error(`Gemini response item ${index} must include contextNotes.`);
  }

  return {
    name: original.name,
    mappedName: item.mappedName.trim(),
    originalContent: original.content,
    mappedContent: item.mappedContent.trim(),
    detectedSourceLocale: item.detectedSourceLocale,
    contextNotes: item.contextNotes.map((note, noteIndex) => {
      if (!isRecord(note)) {
        throw new Error(`Gemini response item ${index} note ${noteIndex} must be an object.`);
      }
      return normalizeNote(note, index, noteIndex);
    })
  };
}

function normalizeGeminiResult(
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

  if (geminiResult.items.length !== request.contents.length) {
    throw new Error("Gemini response item count must match request contents count.");
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
      return normalizeItem(item, request.contents[index], index);
    })
  };
}

export async function mapResumeContext(
  request: ResumeContextMappingRequest
): Promise<ResumeContextMappingResult> {
  if (!hasGeminiKey()) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const geminiResult = await generateGeminiJson<GeminiResumeContextResult>({
    prompt: await buildPrompt(request),
    schema: resumeContextMappingSchema,
    temperature: 0.2
  });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const response = normalizeGeminiResult(geminiResult, request, id, createdAt);

  if (supabaseServer) {
    await supabaseServer.from("resume_context_mappings").insert({
      id,
      target_locale: request.targetLocale,
      detected_source_locale: response.detectedSourceLocale,
      request,
      response
    });
  }

  return response;
}
