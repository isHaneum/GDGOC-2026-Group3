type GeminiJsonOptions = {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
};

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

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiJson<T>({
  prompt,
  schema,
  temperature = 0.2
}: GeminiJsonOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
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
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = extractTextFromGeminiResponse(payload);
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return parseJsonText<T>(text);
}
