import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { GeminiKeySource } from "../../shared/companyCriteriaTypes";

type GeminiJsonOptions = {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
};

type GeminiConfiguration = {
  apiKey: string | null;
  configured: boolean;
  keySource: GeminiKeySource;
  model: string;
  modelCandidates: string[];
};

const geminiKeyPath = path.resolve(process.cwd(), "gemini.key");
const defaultModelCandidates = ["gemini-2.5-flash", "gemini-1.5-flash"];

function extractTextFromGeminiResponse(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part: { text?: string }) => part.text ?? "").join("").trim();
}

function parseJsonText<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error("Gemini did not return parseable JSON.");
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function readGeminiKeyFromFile(): string | null {
  if (!existsSync(geminiKeyPath)) {
    return null;
  }

  const fileValue = readFileSync(geminiKeyPath, "utf8").trim();
  return fileValue || null;
}

export function getGeminiConfiguration(): GeminiConfiguration {
  const envApiKey = process.env.GEMINI_API_KEY?.trim();
  const fileApiKey = envApiKey ? null : readGeminiKeyFromFile();
  const modelCandidates = unique([process.env.GEMINI_MODEL ?? "", ...defaultModelCandidates]);

  return {
    apiKey: envApiKey || fileApiKey,
    configured: Boolean(envApiKey || fileApiKey),
    keySource: envApiKey ? "env" : fileApiKey ? "file" : "none",
    model: modelCandidates[0] ?? defaultModelCandidates[0],
    modelCandidates
  };
}

export function hasGeminiKey(): boolean {
  return getGeminiConfiguration().configured;
}

export async function generateGeminiJson<T>({
  prompt,
  schema,
  temperature = 0.2
}: GeminiJsonOptions): Promise<T> {
  const configuration = getGeminiConfiguration();
  if (!configuration.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let lastError: Error | null = null;

  for (const model of configuration.modelCandidates) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": configuration.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            responseJsonSchema: schema
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Gemini request failed: ${response.status} ${errorText}`);
      if (response.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }

    const payload = await response.json();
    const text = extractTextFromGeminiResponse(payload);
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return parseJsonText<T>(text);
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("No supported Gemini model was available.");
}
