'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadSampleDeveloperProfiles
} from "@src/lib/companyCriteria";
import {
  formatCompanyLogo,
  formatCompanySalarySummary,
  formatExperienceRange,
  formatLanguageSummary,
  formatLocationSummary,
  formatQualificationSummary
} from "@src/lib/fitDisplayHelpers";
import { rankCompaniesForDeveloper } from "@src/lib/twoSidedFitEngine";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  DeveloperPreference,
  DeveloperToCompanyFitResult
} from "@shared/companyCriteriaTypes";

type LoadState = "loading" | "ready" | "error";

function formatList(values: string[] | undefined, fallback = "확인 필요") {
  return values && values.length ? values.join(", ") : fallback;
}

function CompanyLogo({ company }: { company: CompanyJobProfile }) {
  const [broken, setBroken] = useState(false);
  const logo = broken ? null : formatCompanyLogo(company);

  if (!logo) {
    return (
      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-xs font-black text-gray-400">
        {company.companyName.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logo.src}
      alt={logo.alt}
      onError={() => setBroken(true)}
      className="h-12 w-20 shrink-0 rounded-xl border border-gray-100 bg-white object-contain p-2"
    />
  );
}

export default function DeveloperDashboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [developers, setDevelopers] = useState<DeveloperPreference[]>([]);
  const [companies, setCompanies] = useState<CompanyJobProfile[]>([]);
  const [rubrics, setRubrics] = useState<CompanyEvaluationRubric[]>([]);
  const [signals, setSignals] = useState<CompanyHiringSignal[]>([]);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [nextDevelopers, nextCompanies, nextRubrics, nextSignals] = await Promise.all([
          loadSampleDeveloperProfiles(),
          loadCompanyJobProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals()
        ]);

        if (cancelled) return;
        setDevelopers(nextDevelopers);
        setCompanies(nextCompanies);
        setRubrics(nextRubrics);
        setSignals(nextSignals);
        setSelectedDeveloperId(nextDevelopers[0]?.developerId ?? "");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "개발자 홈 데이터를 불러오지 못했습니다.");
        setLoadState("error");
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDeveloper = useMemo(
    () => developers.find((developer) => developer.developerId === selectedDeveloperId) ?? developers[0] ?? null,
    [developers, selectedDeveloperId]
  );

  const recommendations = useMemo<DeveloperToCompanyFitResult[]>(() => {
    if (!selectedDeveloper || !companies.length) return [];
    return rankCompaniesForDeveloper(selectedDeveloper, companies, rubrics, signals).slice(0, 6);
  }, [companies, rubrics, selectedDeveloper, signals]);

  useEffect(() => {
    const firstRoleId = recommendations[0]?.roleId ?? "";
    if (!recommendations.some((recommendation) => recommendation.roleId === selectedRoleId)) {
      setSelectedRoleId(firstRoleId);
    }
  }, [recommendations, selectedRoleId]);

  const selectedRecommendation =
    recommendations.find((recommendation) => recommendation.roleId === selectedRoleId) ?? recommendations[0] ?? null;
  const selectedCompany =
    companies.find((company) => company.roleId === selectedRecommendation?.roleId) ?? companies[0] ?? null;

  if (loadState === "loading") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">개발자 홈 데이터를 불러오는 중입니다.</div>;
  }

  if (loadState === "error") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-bridge-coral">{errorMessage}</div>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <p className="text-xs font-black uppercase tracking-widest text-bridge-teal">Developer Home</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-ink">개발자 추천 흐름</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                기업별 구인정보, 추천 직무, 자기소개서 작성만 한 화면에서 이어집니다.
              </p>
            </div>
            <label className="block min-w-64">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">프로필</span>
              <select
                value={selectedDeveloperId}
                onChange={(event) => setSelectedDeveloperId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm font-bold text-ink outline-none focus:border-bridge-teal"
              >
                {developers.map((developer) => (
                  <option key={developer.developerId} value={developer.developerId}>
                    {developer.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <section id="jobs" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-bridge-teal">기업별 구인정보</p>
              <h2 className="mt-1 text-2xl font-black text-ink">회사, 직무, 조건 확인</h2>
            </div>
            <span className="text-sm font-bold text-gray-400">{companies.length} roles loaded</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {companies.slice(0, 6).map((company) => (
              <article key={company.roleId} className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                <div className="flex items-start gap-3">
                  <CompanyLogo company={company} />
                  <div className="min-w-0">
                    <h3 className="font-black text-ink">{company.companyName}</h3>
                    <p className="text-sm font-bold text-bridge-teal">{company.roleTitle}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                  <p><span className="font-bold text-ink">지역: </span>{formatLocationSummary(company, "위치 확인 필요")}</p>
                  <p><span className="font-bold text-ink">연봉: </span>{formatCompanySalarySummary(company, "연봉 확인 필요")}</p>
                  <p><span className="font-bold text-ink">언어: </span>{formatLanguageSummary(company, "언어 조건 확인 필요")}</p>
                  <p><span className="font-bold text-ink">경력: </span>{formatExperienceRange(company, "경력 확인 필요")}</p>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-bold text-ink">자격 요건: </span>
                  {formatQualificationSummary(company, "자격 요건 확인 필요")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="recommended-roles" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-bridge-teal">추천 직무</p>
              <h2 className="mt-1 text-2xl font-black text-ink">내 프로필 기준 상위 매칭</h2>
            </div>
            <Link href="/signal-lab?role=developer" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-black">
              Signal Lab에서 보기
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((recommendation) => {
              const company = companies.find((item) => item.roleId === recommendation.roleId);
              return (
                <button
                  type="button"
                  key={recommendation.roleId}
                  onClick={() => setSelectedRoleId(recommendation.roleId)}
                  className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-left transition-all hover:border-bridge-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-3xl font-black text-ink">{Math.round(recommendation.overallFitScore)}</span>
                    <span className="rounded-full bg-bridge-primary/20 px-3 py-1 text-xs font-black text-bridge-teal">추천</span>
                  </div>
                  <h3 className="mt-3 font-black text-ink">{recommendation.companyName}</h3>
                  <p className="text-sm font-bold text-gray-500">{recommendation.roleTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {recommendation.matchedReasons[0] ?? "프로필과 직무 조건이 일부 일치합니다."}
                  </p>
                  {company ? (
                    <p className="mt-3 text-xs font-bold text-gray-400">
                      {formatList(company.requiredTechStacks.slice(0, 4))}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section id="resume" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-sm font-bold text-bridge-teal">자기소개서</p>
              <h2 className="mt-1 text-2xl font-black text-ink">선택한 회사 기준으로 지원 동기 다듬기</h2>
              {selectedCompany && selectedRecommendation ? (
                <div className="mt-4 rounded-2xl bg-bridge-paper p-4 text-sm text-gray-600">
                  <p><span className="font-bold text-ink">선택 회사: </span>{selectedCompany.companyName}</p>
                  <p className="mt-2"><span className="font-bold text-ink">선택 직무: </span>{selectedCompany.roleTitle}</p>
                  <p className="mt-2"><span className="font-bold text-ink">보강 포인트: </span>{selectedRecommendation.missingSignals[0] ?? "회사별 표현을 더 구체화하세요."}</p>
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-bridge-primary/30 bg-bridge-primary/10 p-5">
              <p className="text-sm font-bold text-bridge-teal">지원서 작성으로 이동</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                프로필과 목표 회사/직무를 바탕으로 자기소개서를 수정하고 번역합니다.
              </p>
              <Link href="/apply" className="mt-5 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-sm font-black text-ink hover:opacity-90">
                자기소개서 수정
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
