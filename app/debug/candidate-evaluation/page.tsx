"use client";

import { Loader2, Play, RefreshCcw, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { evaluateCandidate, getCandidateEvaluationStatus } from "../../../src/lib/candidateEvaluation";
import { loadCompanyRubrics } from "../../../src/lib/companyCriteria";
import type {
  CandidateEvaluationResult,
  CandidateEvaluationStatus,
  CandidateProfileInput,
  CompanyEvaluationRubric
} from "../../../shared/companyCriteriaTypes";

type BatchEvaluationItem = {
  companyId: string;
  companyName: string;
  overallFitScore?: number;
  recommendedNextStep?: CandidateEvaluationResult["recommendedNextStep"];
  evaluationMode?: CandidateEvaluationResult["evaluationMode"];
  fallbackReason?: string;
  error?: string;
};

const sampleCandidate: CandidateProfileInput = {
  candidateName: "Demo Candidate",
  targetRole: "Frontend / Mobile Developer",
  resumeText:
    "I built mobile and web products using SwiftUI, React, TypeScript, Firebase, and REST API integration. I have experience shipping authentication flows, dashboard UI, bug fixes, and improving UX based on user feedback.",
  portfolioText:
    "Built a medication habit tracking app, a Korea-Japan collaboration prototype, and several frontend-heavy product demos with analytics and onboarding.",
  githubSummary:
    "I use GitHub for feature branches, pull requests, code reviews, and documenting implementation decisions.",
  languageSkills: ["Korean native", "Japanese intermediate", "English intermediate"],
  projectExperience:
    "Worked on several team projects and solo prototypes. Comfortable with iterative delivery, UI implementation, and integrating external APIs.",
  selfIntroduction:
    "I want to contribute to products that connect Korean and Japanese users with practical and well-crafted digital experiences.",
  motivation:
    "I am interested in Japanese IT companies because I want to build user-facing products and grow through cross-border collaboration."
};

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function parseLanguageSkills(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nextStepLabel(value: CandidateEvaluationResult["recommendedNextStep"] | undefined): string {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

export default function CandidateEvaluationDebugPage() {
  const [rubrics, setRubrics] = useState<CompanyEvaluationRubric[]>([]);
  const [status, setStatus] = useState<CandidateEvaluationStatus | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [candidate, setCandidate] = useState<CandidateProfileInput>(sampleCandidate);
  const [languageSkillsText, setLanguageSkillsText] = useState(sampleCandidate.languageSkills?.join(", ") ?? "");
  const [result, setResult] = useState<CandidateEvaluationResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchEvaluationItem[]>([]);
  const [loadingState, setLoadingState] = useState<"boot" | "single" | "all" | null>("boot");
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [loadedRubrics, loadedStatus] = await Promise.all([loadCompanyRubrics(), getCandidateEvaluationStatus()]);
        setRubrics(loadedRubrics);
        setStatus(loadedStatus);
        setSelectedCompanyId((current) => current || loadedRubrics[0]?.companyId || "");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load debug page data.");
      } finally {
        setLoadingState(null);
      }
    }

    void bootstrap();
  }, []);

  const filteredRubrics = rubrics.filter((rubric) => {
    const haystack = `${rubric.companyName} ${rubric.companyId} ${rubric.targetRole}`.toLowerCase();
    return haystack.includes(companySearch.trim().toLowerCase());
  });

  const selectedRubric = rubrics.find((rubric) => rubric.companyId === selectedCompanyId) ?? filteredRubrics[0] ?? null;

  async function refreshStatus() {
    const loadedStatus = await getCandidateEvaluationStatus();
    setStatus(loadedStatus);
  }

  function updateCandidate<K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) {
    setCandidate((current) => ({ ...current, [key]: value }));
  }

  async function handleEvaluateSelected() {
    if (!selectedRubric) {
      setError("No company rubric is selected.");
      return;
    }

    setError(null);
    setBatchResults([]);
    setLoadingState("single");
    setProgressText(`${selectedRubric.companyName} evaluation in progress`);

    try {
      const evaluation = await evaluateCandidate(selectedRubric.companyId, {
        ...candidate,
        languageSkills: parseLanguageSkills(languageSkillsText)
      });
      setResult(evaluation);
      await refreshStatus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Candidate evaluation failed.");
    } finally {
      setLoadingState(null);
      setProgressText(null);
    }
  }

  async function handleEvaluateAll() {
    setError(null);
    setResult(null);
    setLoadingState("all");
    const nextBatchResults: BatchEvaluationItem[] = [];

    for (const rubric of filteredRubrics) {
      setProgressText(`Evaluating ${rubric.companyName} (${nextBatchResults.length + 1}/${filteredRubrics.length})`);
      try {
        const evaluation = await evaluateCandidate(rubric.companyId, {
          ...candidate,
          languageSkills: parseLanguageSkills(languageSkillsText)
        });
        nextBatchResults.push({
          companyId: rubric.companyId,
          companyName: rubric.companyName,
          overallFitScore: evaluation.overallFitScore,
          recommendedNextStep: evaluation.recommendedNextStep,
          evaluationMode: evaluation.evaluationMode,
          fallbackReason: evaluation.debug.fallbackReason
        });
      } catch (caught) {
        nextBatchResults.push({
          companyId: rubric.companyId,
          companyName: rubric.companyName,
          error: caught instanceof Error ? caught.message : "Evaluation failed."
        });
      }

      setBatchResults([...nextBatchResults]);
    }

    setLoadingState(null);
    setProgressText(null);
    await refreshStatus().catch(() => undefined);
  }

  function handleResetSample() {
    setCandidate(sampleCandidate);
    setLanguageSkillsText(sampleCandidate.languageSkills?.join(", ") ?? "");
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Debug Surface</p>
            <h1 className="mt-2 text-2xl font-semibold">Company Candidate Evaluation</h1>
            <p className="mt-2 text-sm text-slate-300">
              회사별 rubric 과 Gemini 사용 여부를 한 화면에서 직접 확인할 수 있는 개발자용 검증 페이지입니다.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Gemini status</p>
                <p className="text-xs text-slate-400">현재 서버가 어떤 키 소스를 보고 있는지 표시합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshStatus()}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/10"
              >
                <RefreshCcw size={15} />
              </button>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-slate-400">Configured</dt>
                <dd className={classNames("mt-1 font-semibold", status?.geminiConfigured ? "text-emerald-300" : "text-rose-300")}>
                  {status?.geminiConfigured ? "yes" : "no"}
                </dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-slate-400">Key source</dt>
                <dd className="mt-1 font-semibold">{status?.geminiKeySource ?? "loading"}</dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-slate-400">Model</dt>
                <dd className="mt-1 font-semibold">{status?.geminiModel ?? "loading"}</dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-slate-400">Rubrics</dt>
                <dd className="mt-1 font-semibold">{status?.rubricCount ?? rubrics.length}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <label className="text-sm font-semibold">Company search</label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                className="h-11 w-full border-0 bg-transparent text-sm text-white outline-none"
                placeholder="mercari, wantedly, frontend"
              />
            </div>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto thin-scrollbar pr-1">
              {filteredRubrics.map((rubric) => (
                <button
                  key={rubric.companyId}
                  type="button"
                  onClick={() => setSelectedCompanyId(rubric.companyId)}
                  className={classNames(
                    "w-full rounded-2xl border px-3 py-3 text-left transition",
                    selectedRubric?.companyId === rubric.companyId
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <p className="font-semibold text-white">{rubric.companyName}</p>
                  <p className="mt-1 text-xs text-slate-400">{rubric.companyId}</p>
                  <p className="mt-2 text-xs text-slate-300">{rubric.targetRole}</p>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Manual Test</p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedRubric?.companyName ?? "Select a company"}</h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  동일한 후보 입력값을 회사별 rubric 에 대입해 바로 비교할 수 있습니다. "Run all"은 현재 검색된 회사 목록 전체를 순차 평가합니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetSample}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw size={16} />
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={() => void handleEvaluateSelected()}
                  disabled={!selectedRubric || loadingState !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingState === "single" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Run selected company
                </button>
                <button
                  type="button"
                  onClick={() => void handleEvaluateAll()}
                  disabled={!filteredRubrics.length || loadingState !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingState === "all" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Run all filtered companies
                </button>
              </div>
            </div>

            {progressText ? (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{progressText}</div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}
            {loadingState === "boot" ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading debug data...</div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Candidate name</span>
                <input
                  value={candidate.candidateName}
                  onChange={(event) => updateCandidate("candidateName", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none ring-0 transition focus:border-slate-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Target role</span>
                <input
                  value={candidate.targetRole ?? ""}
                  onChange={(event) => updateCandidate("targetRole", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none ring-0 transition focus:border-slate-400"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold">Resume text</span>
                <textarea
                  value={candidate.resumeText}
                  onChange={(event) => updateCandidate("resumeText", event.target.value)}
                  className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold">Portfolio text</span>
                <textarea
                  value={candidate.portfolioText ?? ""}
                  onChange={(event) => updateCandidate("portfolioText", event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold">GitHub summary</span>
                <textarea
                  value={candidate.githubSummary ?? ""}
                  onChange={(event) => updateCandidate("githubSummary", event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Language skills</span>
                <input
                  value={languageSkillsText}
                  onChange={(event) => setLanguageSkillsText(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Project experience</span>
                <input
                  value={candidate.projectExperience ?? ""}
                  onChange={(event) => updateCandidate("projectExperience", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold">Self introduction</span>
                <textarea
                  value={candidate.selfIntroduction ?? ""}
                  onChange={(event) => updateCandidate("selfIntroduction", event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold">Motivation</span>
                <textarea
                  value={candidate.motivation ?? ""}
                  onChange={(event) => updateCandidate("motivation", event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
            </div>
          </section>

          {result ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Latest result</p>
                    <h3 className="mt-2 text-2xl font-semibold">{result.companyName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{result.targetRole}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Overall fit</p>
                    <p className="mt-1 text-3xl font-semibold">{result.overallFitScore}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Evaluation mode</p>
                    <p className="mt-2 text-lg font-semibold capitalize">{result.evaluationMode}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next step</p>
                    <p className="mt-2 text-lg font-semibold capitalize">{nextStepLabel(result.recommendedNextStep)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gemini key source</p>
                    <p className="mt-2 text-lg font-semibold">{result.debug.geminiKeySource}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold">Recruiter lens summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{result.recruiterLensSummary}</p>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Criterion</th>
                        <th className="px-4 py-3 font-semibold">Score</th>
                        <th className="px-4 py-3 font-semibold">Matched</th>
                        <th className="px-4 py-3 font-semibold">Missing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {result.criterionScores.map((item) => (
                        <tr key={item.criterionName}>
                          <td className="px-4 py-4 align-top">
                            <p className="font-semibold text-slate-900">{item.criterionName}</p>
                            <p className="mt-1 text-xs text-slate-500">weight {item.weight}</p>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <p className="font-semibold text-slate-900">{item.score}</p>
                            <p className="mt-1 text-xs text-slate-500">weighted {item.weightedScore}</p>
                          </td>
                          <td className="px-4 py-4 align-top text-slate-600">{item.matchedEvidence.join(", ") || "-"}</td>
                          <td className="px-4 py-4 align-top text-slate-600">{item.missingEvidence.join(", ") || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Raw JSON</summary>
                  <pre className="mt-4 overflow-auto text-xs leading-6 text-slate-700">{JSON.stringify(result, null, 2)}</pre>
                </details>
              </article>

              <aside className="space-y-4 rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Debug info</p>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <dt className="text-slate-500">Gemini attempted</dt>
                      <dd className="mt-1 font-semibold">{result.debug.geminiAttempted ? "yes" : "no"}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <dt className="text-slate-500">Gemini used</dt>
                      <dd className="mt-1 font-semibold">{result.debug.geminiUsed ? "yes" : "no"}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <dt className="text-slate-500">Gemini model</dt>
                      <dd className="mt-1 font-semibold">{result.debug.geminiModel ?? "-"}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <dt className="text-slate-500">Fallback reason</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-700">{result.debug.fallbackReason ?? "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="text-sm font-semibold">Strengths</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {result.strengths.length ? result.strengths.map((item) => <li key={item}>{item}</li>) : <li>-</li>}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold">Gaps</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {result.gaps.length ? result.gaps.map((item) => <li key={item}>{item}</li>) : <li>-</li>}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold">Recommended actions</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {result.recommendedActions.length ? result.recommendedActions.map((item) => <li key={item}>{item}</li>) : <li>-</li>}
                  </ul>
                </div>
              </aside>
            </section>
          ) : null}

          {batchResults.length ? (
            <section className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Batch compare</p>
                  <h3 className="mt-2 text-2xl font-semibold">Company-by-company summary</h3>
                </div>
                <p className="text-sm text-slate-500">{batchResults.length} companies processed</p>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Mode</th>
                      <th className="px-4 py-3 font-semibold">Next step</th>
                      <th className="px-4 py-3 font-semibold">Error / fallback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchResults.map((item) => (
                      <tr key={item.companyId}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{item.companyName}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.companyId}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{item.overallFitScore ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-700">{item.evaluationMode ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-700">{nextStepLabel(item.recommendedNextStep)}</td>
                        <td className="px-4 py-4 text-slate-600">{item.error ?? item.fallbackReason ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}