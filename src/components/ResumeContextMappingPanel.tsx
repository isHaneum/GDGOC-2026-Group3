"use client";

import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DeveloperPreference } from "@shared/companyCriteriaTypes";
import { MARKETS, getCurrentMarket } from "@shared/market";
import type { ResumeContextMappingResult } from "@shared/types";
import { mapResumeContext } from "@src/api/client";
import { buildResumeContextRequest, getMarketDirection } from "@src/lib/marketAdapter";

type RequestState = "idle" | "loading" | "ready" | "blocked";

export function ResumeContextMappingPanel({ applicant }: { applicant: DeveloperPreference }) {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [state, setState] = useState<RequestState>("idle");
  const [result, setResult] = useState<ResumeContextMappingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMarket(getCurrentMarket());
  }, []);

  const direction = getMarketDirection(market);
  const request = useMemo(() => buildResumeContextRequest(applicant, market), [applicant, market]);

  async function handleRunMapping() {
    setState("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const nextResult = await mapResumeContext(request);
      setResult(nextResult);
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Resume context mapping AI service is unavailable."
      );
      setState("blocked");
    }
  }

  return (
    <section className="mt-3 rounded-lg border border-bridge-primary/20 bg-white p-3.5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bridge-teal" aria-hidden="true" />
            <h2 className="text-body font-bold text-ink">Portfolio Context Mapping</h2>
          </div>
          <p className="mt-1 text-caption text-gray-500">
            {direction.sourceCountry} applicant portfolio → {direction.targetCountry} recruiter context
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunMapping}
          disabled={state === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-bridge-primary px-3 py-2 text-caption font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Map context
        </button>
      </div>

      {state === "blocked" ? (
        <div className="mt-3 flex gap-2 rounded-lg border border-bridge-coral/30 bg-bridge-coral/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bridge-coral" aria-hidden="true" />
          <div>
            <p className="text-caption font-bold text-bridge-coral">AI context mapping is unavailable</p>
            <p className="mt-1 text-caption text-gray-600">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {result.items.map((item) => (
            <article key={item.fieldKey} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-caption font-black uppercase tracking-wider text-gray-400">
                  {item.mappedLabel}
                </h3>
                <span className="text-caption font-medium text-gray-400">{item.detectedSourceLocale}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-body leading-relaxed text-gray-700">
                {item.mappedValue}
              </p>
              {item.contextNotes.length ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {item.contextNotes.map((note, index) => (
                    <li
                      key={`${item.fieldKey}-${index}`}
                      className="rounded border border-gray-100 bg-white px-2.5 py-1.5 text-caption text-gray-600"
                    >
                      <span className="mr-1 font-bold text-bridge-teal">{note.confidence}</span>
                      {note.note}
                      {note.basis ? <span className="ml-1 text-gray-400">Basis: {note.basis}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
