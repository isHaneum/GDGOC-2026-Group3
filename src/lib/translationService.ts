export type Locale = "ko" | "ja" | "en";
export type SourceLocale = Locale | "auto";
export type TranslationContext = "resume" | "company" | "mission" | "ui" | "explanation";
export type TranslationProvider = "google" | "cache" | "mock" | "none";

export type TranslateRequest = {
  text: string;
  sourceLocale?: SourceLocale;
  targetLocale: Locale;
  context?: TranslationContext;
};

export type TranslateResult = {
  translatedText: string;
  sourceLocale: SourceLocale;
  targetLocale: Locale;
  provider: TranslationProvider;
  cached?: boolean;
};

const SERVER_TRANSLATION_ENDPOINT = "/api/translate";
const SESSION_PREFIX = "bridgepass_translate:";
const browserCache = new Map<string, TranslateResult>();

function makeCacheKey(request: Required<Pick<TranslateRequest, "text" | "sourceLocale" | "targetLocale" | "context">>) {
  return JSON.stringify([request.sourceLocale, request.targetLocale, request.context, request.text.trim()]);
}

function mockTranslate(request: TranslateRequest): TranslateResult {
  return {
    translatedText: request.text,
    sourceLocale: request.sourceLocale ?? "auto",
    targetLocale: request.targetLocale,
    provider: request.text.trim() ? "mock" : "none",
    cached: false
  };
}

function readSessionCache(key: string) {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
    if (!cached) return null;
    return JSON.parse(cached) as TranslateResult;
  } catch {
    return null;
  }
}

function writeSessionCache(key: string, value: TranslateResult) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(`${SESSION_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable or full. In-memory cache still handles the current session.
  }
}

export async function translateText(request: TranslateRequest): Promise<TranslateResult> {
  const text = request.text.trim();
  const sourceLocale = request.sourceLocale ?? "auto";
  const context = request.context ?? "explanation";

  if (!text) return mockTranslate({ ...request, text });

  const cacheKey = makeCacheKey({
    text,
    sourceLocale,
    targetLocale: request.targetLocale,
    context
  });

  const inMemory = browserCache.get(cacheKey);
  if (inMemory) return { ...inMemory, provider: "cache", cached: true };

  const sessionCached = readSessionCache(cacheKey);
  if (sessionCached) {
    browserCache.set(cacheKey, sessionCached);
    return { ...sessionCached, provider: "cache", cached: true };
  }

  try {
    const response = await fetch(SERVER_TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        sourceLocale,
        targetLocale: request.targetLocale,
        context
      })
    });

    if (!response.ok) return mockTranslate({ ...request, text, sourceLocale, context });

    const result = (await response.json()) as Partial<TranslateResult>;
    const normalized: TranslateResult = {
      translatedText: typeof result.translatedText === "string" ? result.translatedText : text,
      sourceLocale: result.sourceLocale ?? sourceLocale,
      targetLocale: result.targetLocale ?? request.targetLocale,
      provider: result.provider ?? "mock",
      cached: Boolean(result.cached)
    };

    browserCache.set(cacheKey, normalized);
    writeSessionCache(cacheKey, normalized);
    return normalized;
  } catch {
    return mockTranslate({ ...request, text, sourceLocale, context });
  }
}

export async function translateTexts({
  texts,
  sourceLocale = "auto",
  targetLocale,
  context = "explanation"
}: {
  texts: string[];
  sourceLocale?: SourceLocale;
  targetLocale: Locale;
  context?: TranslationContext;
}): Promise<TranslateResult[]> {
  return Promise.all(texts.map((text) => translateText({ text, sourceLocale, targetLocale, context })));
}

export async function translateObjectFields<T extends Record<string, unknown>>(
  object: T,
  fields: Array<keyof T>,
  targetLocale: Locale,
  sourceLocale: SourceLocale = "auto"
): Promise<T> {
  const entries = await Promise.all(
    fields.map(async (field) => {
      const value = object[field];

      if (typeof value === "string") {
        const result = await translateText({
          text: value,
          sourceLocale,
          targetLocale,
          context: "explanation"
        });

        return [field, result.translatedText] as const;
      }

      if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        const translatedItems = await Promise.all(
          value.map(async (item) => {
            const result = await translateText({
              text: item,
              sourceLocale,
              targetLocale,
              context: "explanation"
            });
            return result.translatedText;
          })
        );

        return [field, translatedItems] as const;
      }

      return [field, value] as const;
    })
  );

  return {
    ...object,
    ...Object.fromEntries(entries)
  };
}
