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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">지원자 목록</h1>
          <p className="text-gray-500">
            {market.targetCountry} 기업 문화에 깊이 부합하는 {market.sourceCountry} 개발자를 찾아보세요.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            {company ? company.roleTitle : "역할 불러오는 중"}
          </div>
          <div className="bg-bridge-primary/10 px-3 py-1 rounded-full flex items-center">
            <span className="text-[10px] font-black text-bridge-teal uppercase tracking-tighter">
              지원자 목록
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-panel border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              정성적 필터
            </h2>

            <div className="space-y-5">
              <FilterGroup
                title="문화적 강점"
                options={["경어 능숙도", "UI 현지화", "직장 예절", "팀 조화력"]}
              />
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-bold text-ink mb-3">언어 수준</label>
                <select className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-bridge-primary">
                  <option>N1 / 원어민</option>
                  <option>N2 / 비즈니스</option>
                  <option>N3 / 일상 회화</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-bridge-primary/5 p-5 rounded-xl border border-bridge-primary/20">
            <h3 className="text-sm font-bold text-bridge-teal mb-1.5">매칭 요약</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              기업과 개발자 간의 확정적 매칭 신호를 바탕으로 지원자가 정렬됩니다. 기업 맞춤형 AI 평가는 매칭 컨텍스트 확정 후 제공됩니다.
            </p>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-ink">맞춤 추천</h2>
            <span className="text-xs text-gray-400 font-medium">
              {company ? `${company.companyName} 기준 매칭` : "기업 프로필 불러오는 중"}
            </span>
          </div>

          {dataError ? (
            <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
              <p className="text-sm font-bold text-bridge-coral">매칭 데이터를 불러올 수 없습니다</p>
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
    <div className="bg-white p-5 rounded-xl shadow-panel border border-gray-100 hover:border-bridge-primary transition-all group">
      <div className="flex flex-col md:flex-row justify-between gap-5">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <h3 className="text-lg font-bold group-hover:text-bridge-primary transition-colors">
              {match.developerName}
            </h3>
            <span className="bg-bridge-teal/10 text-bridge-teal text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
              {match.overallFitScore}/100
            </span>
          </div>
          <p className="text-bridge-teal font-bold text-sm mb-3">{match.roleTitle}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {match.topMatchSignals.slice(0, 4).map((tag) => (
              <span key={tag} className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md border border-gray-100">
                {tag}
              </span>
            ))}
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-sm text-gray-600 leading-relaxed">
            <span className="font-bold text-bridge-primary not-italic block mb-0.5">확정적 매칭 분석:</span>
            {match.explanation}
          </div>
        </div>

        <div className="flex flex-col justify-between items-end md:w-36">
          <Link
            href={profileHref}
            className="w-full bg-bridge-primary text-white py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
          >
            프로필 보기
          </Link>
          <span className="text-gray-400 text-xs font-bold py-2 text-right">
            {match.recommendedRecruiterAction.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
