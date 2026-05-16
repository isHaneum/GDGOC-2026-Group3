'use client';

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MARKETS, getCurrentMarket } from "@shared/market";
import { mapResumeContext } from "@src/api/client";
import { evaluateCandidate } from "@src/lib/candidateEvaluation";
import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadSampleDeveloperProfiles
} from "@src/lib/companyCriteria";
import {
  buildCandidateEvaluationInput,
  buildResumeContextRequest,
  filterDevelopersForMarket,
  getMarketDirection
} from "@src/lib/marketAdapter";
import { rankDevelopersForCompany } from "@src/lib/twoSidedFitEngine";
import type {
  CandidateEvaluationResult,
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyToDeveloperFitResult,
  DeveloperPreference
} from "@shared/companyCriteriaTypes";
import type { ResumeContextMappingResult } from "@shared/types";

export default function EmployerDashboard() {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [mounted, setMounted] = useState(false);
  const [jobProfiles, setJobProfiles] = useState<CompanyJobProfile[]>([]);
  const [rubrics, setRubrics] = useState<CompanyEvaluationRubric[]>([]);
  const [signals, setSignals] = useState<CompanyHiringSignal[]>([]);
  const [developers, setDevelopers] = useState<DeveloperPreference[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CandidateEvaluationResult | null>(null);
  const [resumeContext, setResumeContext] = useState<ResumeContextMappingResult | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [evaluationLocked, setEvaluationLocked] = useState<string | null>(null);
  const [resumeLocked, setResumeLocked] = useState<string | null>(null);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [nextJobProfiles, nextRubrics, nextSignals, nextDevelopers] = await Promise.all([
          loadCompanyJobProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals(),
          loadSampleDeveloperProfiles()
        ]);

        if (cancelled) return;
        setJobProfiles(nextJobProfiles);
        setRubrics(nextRubrics);
        setSignals(nextSignals);
        setDevelopers(nextDevelopers);
      } catch (error) {
        if (!cancelled) {
          setDataError(error instanceof Error ? error.message : "Unable to load matching data.");
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const direction = getMarketDirection(market);
  const company = useMemo(
    () => jobProfiles.find((profile) => profile.country === direction.targetCountry) ?? jobProfiles[0] ?? null,
    [direction.targetCountry, jobProfiles]
  );
  const marketDevelopers = useMemo(
    () => filterDevelopersForMarket(developers, market),
    [developers, market]
  );
  const rankedMatches = useMemo(() => {
    if (!company || !marketDevelopers.length) return [];
    return rankDevelopersForCompany(company, marketDevelopers, rubrics, signals).slice(0, 5);
  }, [company, marketDevelopers, rubrics, signals]);
  const selectedMatch =
    rankedMatches.find((match) => match.developerId === selectedDeveloperId) ?? rankedMatches[0] ?? null;
  const selectedCandidate =
    marketDevelopers.find((developer) => developer.developerId === selectedMatch?.developerId) ??
    marketDevelopers[0] ??
    null;

  useEffect(() => {
    setEvaluation(null);
    setResumeContext(null);
    setEvaluationLocked(null);
    setResumeLocked(null);
  }, [market.id, selectedCandidate?.developerId]);

  async function handleEvaluateCandidate() {
    if (!company || !selectedCandidate) return;

    setEvaluationLoading(true);
    setEvaluationLocked(null);

    try {
      const response = await evaluateCandidate(company.companyId, buildCandidateEvaluationInput(selectedCandidate));
      setEvaluation(response);
    } catch (error) {
      setEvaluation(null);
      setEvaluationLocked(error instanceof Error ? error.message : "Candidate evaluation is unavailable.");
    } finally {
      setEvaluationLoading(false);
    }
  }

  async function handleMapResumeContext() {
    if (!selectedCandidate) return;

    setResumeLoading(true);
    setResumeLocked(null);

    try {
      const response = await mapResumeContext(buildResumeContextRequest(selectedCandidate, market));
      setResumeContext(response);
    } catch (error) {
      setResumeContext(null);
      setResumeLocked(error instanceof Error ? error.message : "Resume context mapping is unavailable.");
    } finally {
      setResumeLoading(false);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Employer Matchmaker</h1>
          <p className="text-gray-500">
            Finding {market.sourceCountry} developers with deep {market.targetCountry} resonance.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            {company ? company.roleTitle : "Loading role"}
          </div>
          <div className="bg-bridge-primary/10 px-3 py-1 rounded-full flex items-center">
            <span className="text-[10px] font-black text-bridge-teal uppercase tracking-tighter">
              AI credits on demand
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
              Qualitative Filters
            </h2>

            <div className="space-y-6">
              <FilterGroup
                title="Cultural Strong Point"
                options={["Keigo Proficiency", "UI Localization", "Workplace Etiquette", "Team Harmony"]}
              />
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-bold text-ink mb-3">Language Focus</label>
                <select className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-bridge-primary">
                  <option>N1 / Native</option>
                  <option>N2 / Business</option>
                  <option>N3 / Conversational</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-bridge-primary/5 p-6 rounded-2xl border border-bridge-primary/20">
            <h3 className="text-sm font-bold text-bridge-teal mb-2">Quality Guarantee</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Deterministic ranking is shown first. Gemini-backed evaluation and resume context mapping run only when
              the recruiter explicitly requests them.
            </p>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-ink">Relevant Matches</h2>
            <span className="text-sm text-gray-400 font-medium">
              {company ? `Matching against ${company.companyName}` : "Loading company profile"}
            </span>
          </div>

          {dataError ? (
            <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
              <p className="text-sm font-bold text-bridge-coral">Matching data unavailable</p>
              <p className="mt-1 text-sm text-gray-600">{dataError}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankedMatches.map((match) => (
                <CandidateCard
                  key={match.developerId}
                  match={match}
                  selected={match.developerId === selectedMatch?.developerId}
                  onSelect={() => setSelectedDeveloperId(match.developerId)}
                />
              ))}
            </div>
          )}

          {selectedCandidate && selectedMatch ? (
            <section className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black text-bridge-teal uppercase tracking-widest">
                    Candidate Profile
                  </p>
                  <h2 className="text-2xl font-black text-ink">{selectedCandidate.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCandidate.targetRoles.join(", ")} · {selectedCandidate.yearsOfExperience} years ·{" "}
                    {selectedCandidate.workStylePreference}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleEvaluateCandidate}
                    disabled={evaluationLoading}
                    className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black disabled:opacity-50"
                  >
                    {evaluationLoading ? "Evaluating..." : "Run Candidate Evaluation"}
                  </button>
                  <button
                    onClick={handleMapResumeContext}
                    disabled={resumeLoading}
                    className="bg-bridge-primary text-ink px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {resumeLoading ? "Mapping..." : "Map Resume Context"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <ProfileBlock title="Deterministic Match" items={selectedMatch.topMatchSignals} />
                  <ProfileBlock title="Missing Signals" items={selectedMatch.missingSignals} />
                  <ProfileBlock title="Risks" items={selectedMatch.risks} />
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed">
                    {selectedMatch.explanation}
                  </p>
                </div>

                <div className="space-y-4">
                  <AiPanel title="Candidate Evaluation" locked={evaluationLocked}>
                    {evaluation ? (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between rounded-xl bg-gray-50 p-4">
                          <span className="text-sm font-bold text-gray-500">Overall Fit</span>
                          <span className="text-3xl font-black text-ink">{evaluation.overallFitScore}</span>
                        </div>
                        <ProfileBlock title="Strengths" items={evaluation.strengths} />
                        <ProfileBlock title="Gaps" items={evaluation.gaps} />
                        <p className="text-sm text-gray-600 leading-relaxed">{evaluation.recruiterLensSummary}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Run the evaluation to call the Gemini-backed candidate evaluation API.
                      </p>
                    )}
                  </AiPanel>

                  <AiPanel title="Resume Context Mapping" locked={resumeLocked}>
                    {resumeContext ? (
                      <div className="space-y-4">
                        {resumeContext.items.slice(0, 5).map((item) => (
                          <div key={`${item.name}-${item.mappedName}`} className="rounded-xl bg-gray-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {item.mappedName}
                            </p>
                            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{item.mappedContent}</p>
                            {item.contextNotes[0] ? (
                              <p className="mt-2 text-xs text-bridge-teal">
                                {item.contextNotes[0].note} ({item.contextNotes[0].confidence})
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Map this candidate's profile into recruiter-facing context for {market.targetCountry}.
                      </p>
                    )}
                  </AiPanel>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-3">{title}</label>
      <div className="space-y-2">
        {options.map((filter) => (
          <label key={filter} className="flex items-center group cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-bridge-primary focus:ring-bridge-primary" />
            <span className="ml-3 text-sm text-gray-600 group-hover:text-bridge-primary transition-colors">
              {filter}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CandidateCard({
  match,
  selected,
  onSelect
}: {
  match: CompanyToDeveloperFitResult;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-panel border transition-all group ${
        selected ? "border-bridge-primary" : "border-gray-100 hover:border-bridge-primary"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold group-hover:text-bridge-primary transition-colors">
              {match.developerName}
            </h3>
            <span className="bg-bridge-teal/10 text-bridge-teal text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
              {match.overallFitScore}/100
            </span>
          </div>
          <p className="text-bridge-teal font-bold text-sm mb-4">{match.roleTitle}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {match.topMatchSignals.slice(0, 4).map((tag) => (
              <span key={tag} className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-100">
                {tag}
              </span>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-600 leading-relaxed">
            <span className="font-bold text-bridge-primary not-italic block mb-1">Deterministic Fit Insight:</span>
            {match.explanation}
          </div>
        </div>

        <div className="flex flex-col justify-between items-end md:w-36">
          <button
            onClick={onSelect}
            className="w-full bg-bridge-primary text-ink py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
          >
            View Profile
          </button>
          <span className="text-gray-400 text-xs font-bold py-2 text-right">
            {match.recommendedRecruiterAction.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <p key={item} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function AiPanel({
  title,
  locked,
  children
}: {
  title: string;
  locked: string | null;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-black uppercase tracking-widest text-ink mb-4">{title}</h3>
      {locked ? (
        <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
          <p className="text-sm font-bold text-bridge-coral">AI section locked</p>
          <p className="mt-1 text-sm text-gray-600">
            {locked} Configure the Gemini API key and retry this action.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
