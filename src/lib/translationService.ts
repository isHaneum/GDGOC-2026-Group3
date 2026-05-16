export type Locale = "ko" | "ja" | "en";

export type TranslateRequest = {
  text: string;
  sourceLocale?: Locale | "auto";
  targetLocale: Locale;
  context?: "resume" | "company" | "mission" | "ui" | "explanation";
};

export type TranslateResult = {
  translatedText: string;
  sourceLocale: Locale | "auto";
  targetLocale: Locale;
  provider: "mock" | "server" | "none";
};

const SERVER_TRANSLATION_ENDPOINT = "/api/translate";

function mockTranslate(request: TranslateRequest): TranslateResult {
  return {
    translatedText: request.text,
    sourceLocale: request.sourceLocale ?? "auto",
    targetLocale: request.targetLocale,
    provider: request.text.trim() ? "mock" : "none"
  };
}

export async function translateText(request: TranslateRequest): Promise<TranslateResult> {
  if (!request.text.trim()) {
    return {
      translatedText: request.text,
      sourceLocale: request.sourceLocale ?? "auto",
      targetLocale: request.targetLocale,
      provider: "none"
    };
  }

  try {
    const response = await fetch(SERVER_TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: request.text,
        sourceLocale: request.sourceLocale ?? "auto",
        targetLocale: request.targetLocale,
        context: request.context
      })
    });

    if (!response.ok) {
      return mockTranslate(request);
    }

    const result = (await response.json()) as Partial<TranslateResult>;
    return {
      translatedText: typeof result.translatedText === "string" ? result.translatedText : request.text,
      sourceLocale: (result.sourceLocale as Locale | "auto" | undefined) ?? request.sourceLocale ?? "auto",
      targetLocale: (result.targetLocale as Locale | undefined) ?? request.targetLocale,
      provider: result.provider === "server" ? "server" : "mock"
    };
  } catch {
    return mockTranslate(request);
  }
}

export async function translateObjectFields<T extends Record<string, unknown>>(
  object: T,
  fields: string[],
  targetLocale: Locale
): Promise<T> {
  const entries = await Promise.all(
    fields.map(async (field) => {
      const value = object[field];

      if (typeof value === "string") {
        const result = await translateText({
          text: value,
          sourceLocale: "auto",
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
              sourceLocale: "auto",
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