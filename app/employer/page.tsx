'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MARKETS, getCurrentMarket } from "@shared/market";
import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadSampleDeveloperProfiles
} from "@src/lib/companyCriteria";
import { buildApplicantProfilePath } from "@src/lib/applicantProfiles";
import {
  filterDevelopersForMarket,
  getMarketDirection
} from "@src/lib/marketAdapter";
import { rankDevelopersForCompany } from "@src/lib/twoSidedFitEngine";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyToDeveloperFitResult,
  DeveloperPreference
} from "@shared/companyCriteriaTypes";

export default function EmployerDashboard() {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [mounted, setMounted] = useState(false);
  const [jobProfiles, setJobProfiles] = useState<CompanyJobProfile[]>([]);
  const [rubrics, setRubrics] = useState<CompanyEvaluationRubric[]>([]);
  const [signals, setSignals] = useState<CompanyHiringSignal[]>([]);
  const [developers, setDevelopers] = useState<DeveloperPreference[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

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
              Applicant list
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
            <h3 className="text-sm font-bold text-bridge-teal mb-2">Ranking Summary</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Applicants are ordered with deterministic company-to-developer matching signals. Company-specific AI
              evaluation will be added after the matching context is finalized.
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
                  profileHref={buildApplicantProfilePath(match.developerId)}
                />
              ))}
            </div>
          )}
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
  profileHref
}: {
  match: CompanyToDeveloperFitResult;
  profileHref: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100 hover:border-bridge-primary transition-all group">
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
          <Link
            href={profileHref}
            className="w-full bg-bridge-primary text-ink py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
          >
            View Profile
          </Link>
          <span className="text-gray-400 text-xs font-bold py-2 text-right">
            {match.recommendedRecruiterAction.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
