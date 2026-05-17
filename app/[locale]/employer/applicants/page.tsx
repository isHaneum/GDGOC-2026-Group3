'use client';

import { Link } from "@i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MARKETS, getCurrentMarket } from "@shared/market";
import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals
} from "@src/lib/companyCriteria";
import { buildApplicantProfilePath, loadApplicantProfiles } from "@src/lib/applicantProfiles";
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
  const t = useTranslations("employer");
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
          loadApplicantProfiles()
        ]);

        if (cancelled) return;
        setJobProfiles(nextJobProfiles);
        setRubrics(nextRubrics);
        setSignals(nextSignals);
        setDevelopers(nextDevelopers);
      } catch (error) {
        if (!cancelled) {
          setDataError(error instanceof Error ? error.message : t("dataLoadFailedTitle"));
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [t]);

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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-h1 font-bold mb-1">{t("applicantsTitle")}</h1>
          <p className="text-gray-500">
            {t("applicantsDescription", { targetCountry: market.targetCountry, sourceCountry: market.sourceCountry })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-body font-bold shadow-sm">
            {company ? company.roleTitle : t("roleLoading")}
          </div>
          <div className="bg-bridge-primary/10 px-3 py-1 rounded-full flex items-center">
            <span className="text-caption font-black text-bridge-teal uppercase tracking-tighter">
              {t("applicantsTitle")}
            </span>
          </div>
        </div>
      </header>

      {/* Top Filter Bar */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-panel md:flex-row md:items-center">
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <h2 className="shrink-0 text-caption font-black uppercase tracking-widest text-gray-400">
            {t("culturalStrength")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {["filterHonorifics", "filterUiLocalization", "filterWorkManners", "filterTeamHarmony"].map((filterKey) => (
              <label key={filterKey} className="group flex cursor-pointer items-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 transition-colors hover:border-bridge-primary">
                <input type="checkbox" className="hidden" />
                <span className="text-caption font-bold text-gray-500 group-hover:text-bridge-primary">
                  {t(filterKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <label className="shrink-0 text-caption font-black uppercase tracking-widest text-gray-400">{t("languageLevel")}</label>
          <select className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-caption font-bold outline-none focus:ring-2 focus:ring-bridge-primary">
            <option>{t("languageNative")}</option>
            <option>{t("languageBusiness")}</option>
            <option>{t("languageConversational")}</option>
          </select>
        </div>
      </div>

      <main>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h2 font-bold text-ink">{t("customRecommendations")}</h2>
          <span className="text-caption font-medium text-gray-400">
            {company ? t("companyMatch", { companyName: company.companyName }) : t("companyLoading")}
          </span>
        </div>

        {dataError ? (
          <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
            <p className="text-body font-bold text-bridge-coral">{t("dataLoadFailedTitle")}</p>
            <p className="mt-1 text-body text-gray-600">{dataError}</p>
          </div>
        ) : rankedMatches.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rankedMatches.map((match) => (
              <CandidateCard
                key={match.developerId}
                match={match}
                profileHref={buildApplicantProfilePath(match.developerId)}
                analysisLabel={t("analysis")}
                viewProfileLabel={t("viewProfile")}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-panel">
            <p className="text-body font-bold text-ink">{t("noApplicantsTitle")}</p>
            <p className="mt-1 text-body text-gray-500">
              {t("noApplicantsDescription")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function CandidateCard({
  match,
  profileHref,
  analysisLabel,
  viewProfileLabel
}: {
  match: CompanyToDeveloperFitResult;
  profileHref: string;
  analysisLabel: string;
  viewProfileLabel: string;
}) {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-panel transition-all hover:border-bridge-primary/30">
      <div>
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-h2 font-bold text-ink transition-colors group-hover:text-bridge-primary">
              {match.developerName}
            </h3>
            <p className="mt-0.5 text-body font-bold text-bridge-teal">{match.roleTitle}</p>
          </div>
          <span className="shrink-0 rounded-full bg-bridge-teal/10 px-2.5 py-1 text-caption font-black uppercase tracking-tighter text-bridge-teal">
            {match.overallFitScore}/100
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {match.topMatchSignals.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-bold text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 line-clamp-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-caption leading-relaxed text-gray-600">
          <span className="mr-1 font-bold text-bridge-primary">{analysisLabel}:</span>
          {match.explanation}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4">
        <span className="text-center text-caption font-bold uppercase tracking-widest text-gray-400">
          {match.recommendedRecruiterAction.replace(/_/g, " ")}
        </span>
        <Link
          href={profileHref}
          className="flex w-full justify-center rounded-xl bg-bridge-primary px-4 py-2.5 text-body font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          {viewProfileLabel}
        </Link>
      </div>
    </div>
  );
}
