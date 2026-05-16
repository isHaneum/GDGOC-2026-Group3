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
  formatQualificationSummary,
  formatRoleTitle
} from "@src/lib/fitDisplayHelpers";
import { rankDevelopersForCompany } from "@src/lib/twoSidedFitEngine";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyToDeveloperFitResult,
  DeveloperPreference
} from "@shared/companyCriteriaTypes";

type LoadState = "loading" | "ready" | "error";

function formatList(values: string[] | undefined, fallback = "확인 필요") {
  return values && values.length ? values.join(", ") : fallback;
}

function normalizeWorkStyle(value: CompanyJobProfile["workStyle"] | DeveloperPreference["workStylePreference"]) {
  if (value === "hybrid") return "Hybrid";
  if (value === "remote") return "Remote";
  if (value === "onsite") return "On-site";
  return "Any";
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

function CandidateSummary({
  result,
  developer
}: {
  result: CompanyToDeveloperFitResult;
  developer: DeveloperPreference | null;
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-ink">{result.developerName}</h3>
          <p className="mt-1 text-sm font-bold text-gray-500">
            {formatList(developer?.targetRoles.slice(0, 2), "직무 확인 필요")}
          </p>
        </div>
        <span className="rounded-full bg-bridge-primary/20 px-3 py-1 text-sm font-black text-bridge-teal">
          {Math.round(result.overallFitScore)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {result.topMatchSignals.slice(0, 3).map((signal) => (
          <span key={`${result.developerId}-${signal}`} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
            {signal}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        {result.explanation}
      </p>
    </article>
  );
}

export default function EmployerDashboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [companies, setCompanies] = useState<CompanyJobProfile[]>([]);
  const [developers, setDevelopers] = useState<DeveloperPreference[]>([]);
  const [rubrics, setRubrics] = useState<CompanyEvaluationRubric[]>([]);
  const [signals, setSignals] = useState<CompanyHiringSignal[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [nextCompanies, nextDevelopers, nextRubrics, nextSignals] = await Promise.all([
          loadCompanyJobProfiles(),
          loadSampleDeveloperProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals()
        ]);

        if (cancelled) return;
        setCompanies(nextCompanies);
        setDevelopers(nextDevelopers);
        setRubrics(nextRubrics);
        setSignals(nextSignals);
        setSelectedRoleId(nextCompanies[0]?.roleId ?? "");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "기업 홈 데이터를 불러오지 못했습니다.");
        setLoadState("error");
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.roleId === selectedRoleId) ?? companies[0] ?? null,
    [companies, selectedRoleId]
  );

  const recommendations = useMemo<CompanyToDeveloperFitResult[]>(() => {
    if (!selectedCompany || !developers.length) return [];
    return rankDevelopersForCompany(selectedCompany, developers, rubrics, signals).slice(0, 6);
  }, [developers, rubrics, selectedCompany, signals]);

  const managedApplicants = recommendations.slice(0, 4);

  if (loadState === "loading") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">기업 홈 데이터를 불러오는 중입니다.</div>;
  }

  if (loadState === "error") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-bridge-coral">{errorMessage}</div>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <p className="text-xs font-black uppercase tracking-widest text-bridge-coral">Employer Home</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-ink">기업 추천 흐름</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                추천 개발자, 지원자 관리, 기업/직무 조건만 분리해서 관리합니다.
              </p>
            </div>
            <label className="block min-w-80">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">기업/직무 선택</span>
              <select
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm font-bold text-ink outline-none focus:border-bridge-teal"
              >
                {companies.map((company) => (
                  <option key={company.roleId} value={company.roleId}>
                    {company.companyName} / {company.roleTitle}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <section id="recommended-developers" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-bridge-teal">추천 개발자</p>
              <h2 className="mt-1 text-2xl font-black text-ink">직무 조건 기준 상위 후보</h2>
            </div>
            <Link href="/signal-lab?role=employer" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-black">
              Signal Lab에서 보기
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((result) => (
              <CandidateSummary
                key={result.developerId}
                result={result}
                developer={developers.find((developer) => developer.developerId === result.developerId) ?? null}
              />
            ))}
          </div>
        </section>

        <section id="applicants" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="mb-5">
            <p className="text-sm font-bold text-bridge-teal">지원자 관리</p>
            <h2 className="mt-1 text-2xl font-black text-ink">후보 진행 상태</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_100px] bg-bridge-paper px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">
              <span>Candidate</span>
              <span>Fit signal</span>
              <span>Next action</span>
              <span className="text-right">Score</span>
            </div>
            {managedApplicants.map((result, index) => {
              const developer = developers.find((item) => item.developerId === result.developerId);
              const nextAction =
                index === 0 ? "캐주얼 인터뷰 제안" : index === 1 ? "포트폴리오 확인" : "추가 증거 요청";
              return (
                <div key={`${result.developerId}-pipeline`} className="grid grid-cols-[1.2fr_1fr_1fr_100px] items-center border-t border-gray-100 px-4 py-4 text-sm">
                  <div>
                    <p className="font-black text-ink">{result.developerName}</p>
                    <p className="text-xs font-bold text-gray-400">{developer?.nationality ?? "국적 확인 필요"}</p>
                  </div>
                  <p className="text-gray-600">{result.topMatchSignals[0] ?? "신호 확인 필요"}</p>
                  <p className="font-bold text-bridge-teal">{nextAction}</p>
                  <p className="text-right text-lg font-black text-ink">{Math.round(result.overallFitScore)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="profile" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="mb-5">
            <p className="text-sm font-bold text-bridge-teal">기업/직무 조건</p>
            <h2 className="mt-1 text-2xl font-black text-ink">추천 기준으로 쓰는 역할 프로필</h2>
          </div>

          {selectedCompany ? (
            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-5">
                <div className="flex items-start gap-3">
                  <CompanyLogo company={selectedCompany} />
                  <div>
                    <h3 className="font-black text-ink">{selectedCompany.companyName}</h3>
                    <p className="text-sm font-bold text-bridge-teal">{formatRoleTitle(selectedCompany)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p><span className="font-bold text-ink">지역: </span>{formatLocationSummary(selectedCompany, "위치 확인 필요")}</p>
                  <p><span className="font-bold text-ink">근무 방식: </span>{normalizeWorkStyle(selectedCompany.workStyle)}</p>
                  <p><span className="font-bold text-ink">연봉: </span>{formatCompanySalarySummary(selectedCompany, "연봉 확인 필요")}</p>
                  <p><span className="font-bold text-ink">경력: </span>{formatExperienceRange(selectedCompany, "경력 확인 필요")}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                  <p className="text-sm font-black text-ink">필수 조건</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {formatList(selectedCompany.requiredTechStacks)} · {formatLanguageSummary(selectedCompany, "언어 조건 확인 필요")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4">
                  <p className="text-sm font-black text-ink">자격/우대 조건</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {formatQualificationSummary(selectedCompany, "자격 요건 확인 필요")} · {formatList(selectedCompany.preferredTechStacks, "우대 기술 확인 필요")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 md:col-span-2">
                  <p className="text-sm font-black text-ink">추천 엔진 기준</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    회사의 필수 기술, 언어 조건, 경력 범위, 근무 방식, 동기 적합도를 함께 반영합니다.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
