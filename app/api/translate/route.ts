import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Locale = "ko" | "ja" | "en";
type SourceLocale = Locale | "auto";
type TranslationContext = "resume" | "company" | "mission" | "ui" | "explanation";
type TranslationProvider = "google" | "cache" | "mock" | "none";

type TranslateRequest = {
  text?: string;
  texts?: string[];
  sourceLocale?: SourceLocale;
  targetLocale: Locale;
  context?: TranslationContext;
};

type CachedValue = {
  translatedText: string;
  sourceLocale: SourceLocale;
  targetLocale: Locale;
  provider: TranslationProvider;
  cachedAt: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_CACHE_ITEMS = 800;
const memoryCache = new Map<string, CachedValue>();

const allowedLocales = new Set<Locale>(["ko", "ja", "en"]);

function normalizeSourceLocale(locale: unknown): SourceLocale {
  if (locale === "ko" || locale === "ja" || locale === "en" || locale === "auto") return locale;
  return "auto";
}

function normalizeTargetLocale(locale: unknown): Locale | null {
  if (locale === "ko" || locale === "ja" || locale === "en") return locale;
  return null;
}

function normalizeContext(context: unknown): TranslationContext {
  if (
    context === "resume" ||
    context === "company" ||
    context === "mission" ||
    context === "ui" ||
    context === "explanation"
  ) {
    return context;
  }

  return "explanation";
}

function makeCacheKey(text: string, sourceLocale: SourceLocale, targetLocale: Locale, context: TranslationContext) {
  return JSON.stringify([sourceLocale, targetLocale, context, text.trim()]);
}

function getCached(key: string) {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }

  return {
    ...cached,
    provider: "cache" as const
  };
}

function setCached(key: string, value: CachedValue) {
  if (memoryCache.size >= MAX_CACHE_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }

  memoryCache.set(key, value);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function translateWithGoogle({
  text,
  sourceLocale,
  targetLocale
}: {
  text: string;
  sourceLocale: SourceLocale;
  targetLocale: Locale;
}) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;

  if (!apiKey) {
    return {
      translatedText: text,
      sourceLocale,
      targetLocale,
      provider: "mock" as const
    };
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: text,
      target: targetLocale,
      ...(sourceLocale !== "auto" ? { source: sourceLocale } : {}),
      format: "text"
    })
  });

  if (!response.ok) {
    return {
      translatedText: text,
      sourceLocale,
      targetLocale,
      provider: "mock" as const
    };
  }

  const payload = (await response.json()) as {
    data?: {
      translations?: Array<{
        translatedText?: string;
        detectedSourceLanguage?: string;
      }>;
    };
  };

  const translation = payload.data?.translations?.[0];
  const detectedSource = translation?.detectedSourceLanguage;

  return {
    translatedText: decodeHtmlEntities(translation?.translatedText || text),
    sourceLocale: (allowedLocales.has(detectedSource as Locale) ? detectedSource : sourceLocale) as SourceLocale,
    targetLocale,
    provider: "google" as const
  };
}

async function translateOne(text: string, sourceLocale: SourceLocale, targetLocale: Locale, context: TranslationContext) {
  const cleanText = text.trim();

  if (!cleanText) {
    return {
      translatedText: "",
      sourceLocale,
      targetLocale,
      provider: "none" as const,
      cached: false
    };
  }

  if (sourceLocale === targetLocale) {
    return {
      translatedText: cleanText,
      sourceLocale,
      targetLocale,
      provider: "none" as const,
      cached: false
    };
  }

  const cacheKey = makeCacheKey(cleanText, sourceLocale, targetLocale, context);
  const cached = getCached(cacheKey);

  if (cached) {
    return {
      translatedText: cached.translatedText,
      sourceLocale: cached.sourceLocale,
      targetLocale: cached.targetLocale,
      provider: cached.provider,
      cached: true
    };
  }

  const translated = await translateWithGoogle({ text: cleanText, sourceLocale, targetLocale });

  setCached(cacheKey, {
    ...translated,
    cachedAt: Date.now()
  });

  return {
    ...translated,
    cached: false
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateRequest;
    const targetLocale = normalizeTargetLocale(body.targetLocale);

    if (!targetLocale) {
      return NextResponse.json({ error: "Invalid targetLocale. Use ko, ja, or en." }, { status: 400 });
    }

    const sourceLocale = normalizeSourceLocale(body.sourceLocale);
    const context = normalizeContext(body.context);
    const texts = Array.isArray(body.texts) ? body.texts : typeof body.text === "string" ? [body.text] : [];

    if (!texts.length) {
      return NextResponse.json({ error: "Missing text or texts." }, { status: 400 });
    }

    const limitedTexts = texts.slice(0, 20).map((text) => String(text).slice(0, 5000));
    const translations = await Promise.all(limitedTexts.map((text) => translateOne(text, sourceLocale, targetLocale, context)));

    if (Array.isArray(body.texts)) {
      return NextResponse.json({ translations });
    }

    return NextResponse.json(translations[0]);
  } catch {
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}
