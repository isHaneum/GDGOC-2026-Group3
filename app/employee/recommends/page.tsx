'use client';

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { CompanyJobProfile, CompanySalarySourceLink, DeveloperToCompanyFitResult } from "@shared/companyCriteriaTypes";
import {
  type EmployeeRecommendationsResponse,
  fetchEmployeeRecommendations,
  readCachedEmployeeRecommendations,
  writeCachedEmployeeRecommendations,
} from "@src/lib/employeeRecommendations";
import {
  formatCompanyLogo,
  formatCompanySalarySummary,
  formatExperienceRange,
  formatLanguageSummary,
  formatLocationSummary,
  formatSourceConfidence,
} from "@src/lib/fitDisplayHelpers";

type LoadState = "loading" | "ready" | "error";

function CompanyLogo({ company }: { company: CompanyJobProfile }) {
  const [broken, setBroken] = useState(false);
  const logo = broken ? null : formatCompanyLogo(company);

  if (!logo) {
    return (
      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-caption font-black text-gray-400">
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

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatStacks(company: CompanyJobProfile) {
  const stacks = unique([...company.requiredTechStacks, ...company.preferredTechStacks]);
  return stacks.length ? stacks.slice(0, 10) : ["공개 스택 미기재"];
}

function getCompanyLinks(company: CompanyJobProfile): CompanySalarySourceLink[] {
  if (company.salarySourceLinks?.length) return company.salarySourceLinks.slice(0, 5);

  return (company.sourceUrls ?? []).slice(0, 5).map((url) => ({
    label: new URL(url).hostname.replace(/^www\./, ""),
    url,
  }));
}

function linkLabel(label?: string, supports?: string) {
  if (supports === "officialWebsite") return "Official site";
  if (supports === "careers") return "Careers";
  if (supports?.includes("newGraduate")) return "Salary details";
  if (supports?.includes("averageAnnual") || supports?.includes("averageTenure")) return "Salary source";
  return label ?? "Source";
}

function nextStepLabel(step: DeveloperToCompanyFitResult["recommendedNextStep"]) {
  switch (step) {
    case "apply_now":
      return "바로 지원 가능";
    case "casual_interview":
      return "캐주얼 인터뷰 추천";
    case "trial_project":
      return "과제/실습 준비";
    case "bridge_labs_activity":
      return "브릿지 랩 추천";
    case "research_company":
      return "회사 리서치 우선";
    case "rewrite_motivation":
    default:
      return "지원 동기 보강";
  }
}

function RecommendationCard({
  recommendation,
  company,
  index,
  selected,
  onSelect,
}: {
  recommendation: DeveloperToCompanyFitResult;
  company: CompanyJobProfile;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-bridge-primary bg-bridge-primary/10" : "border-gray-100 bg-bridge-paper hover:border-bridge-primary/40",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-caption font-black uppercase tracking-widest text-gray-400">#{index + 1}</p>
              <h3 className="mt-1 truncate text-h2 font-black text-ink">{recommendation.companyName}</h3>
              <p className="text-body font-bold text-bridge-teal">{recommendation.roleTitle}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-caption font-black text-bridge-teal shadow-sm">
              {Math.round(recommendation.overallFitScore)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-caption font-bold text-gray-500 ring-1 ring-gray-100">
              {nextStepLabel(recommendation.recommendedNextStep)}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-body text-gray-600 md:grid-cols-2">
            <p><span className="font-bold text-ink">지역: </span>{formatLocationSummary(company, "확인 필요")}</p>
            <p><span className="font-bold text-ink">연봉: </span>{formatCompanySalarySummary(company, "확인 필요")}</p>
          </div>

          <p className="mt-3 text-body leading-6 text-gray-600">
            {recommendation.matchedReasons[0] ?? "프로필과 직무 조건이 일부 일치합니다."}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function EmployeeRecommendsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [payload, setPayload] = useState<EmployeeRecommendationsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    const cached = readCachedEmployeeRecommendations();
    if (cached) {
      setPayload(cached);
      setSelectedRoleId(cached.recommendations[0]?.roleId ?? "");
      setLoadState("ready");
    }

    let cancelled = false;

    async function loadData() {
      try {
        const nextPayload = await fetchEmployeeRecommendations();
        if (cancelled) return;
        setPayload(nextPayload);
        writeCachedEmployeeRecommendations(nextPayload);
        setSelectedRoleId((current) => current || nextPayload.recommendations[0]?.roleId || "");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "추천 데이터를 불러오지 못했습니다.");
        if (!cached) setLoadState("error");
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const companiesByRoleId = useMemo(
    () => new Map((payload?.companies ?? []).map((company) => [company.roleId, company])),
    [payload]
  );
  const recommendations = payload?.recommendations ?? [];

  useEffect(() => {
    if (!recommendations.length) return;
    if (!recommendations.some((recommendation) => recommendation.roleId === selectedRoleId)) {
      setSelectedRoleId(recommendations[0]?.roleId ?? "");
    }
  }, [recommendations, selectedRoleId]);

  const selectedRecommendation = useMemo(
    () => recommendations.find((recommendation) => recommendation.roleId === selectedRoleId) ?? recommendations[0] ?? null,
    [recommendations, selectedRoleId]
  );
  const selectedCompany = selectedRecommendation ? companiesByRoleId.get(selectedRecommendation.roleId) ?? null : null;

  if (loadState === "loading") {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">추천 직무를 불러오는 중입니다.</main>;
  }

  if (loadState === "error") {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-bridge-coral">{errorMessage}</main>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8 lg:overflow-hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:max-h-[calc(100vh-112px)]">
        <header className="shrink-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">추천 직무 안내</p>
              <h1 className="mt-2 text-h1 font-black tracking-tight text-ink">추천 직무</h1>
              <p className="mt-2 max-w-3xl text-body leading-6 text-gray-500">
                로그인한 지원자의 포트폴리오와 프로필을 기준으로 계산한 상위 직무 추천입니다.
              </p>
              {payload?.aiEvaluation ? (
                <p className="mt-3 max-w-3xl rounded-xl bg-bridge-paper px-3 py-2 text-caption font-bold text-gray-600">
                  {payload.aiEvaluation.message}
                </p>
              ) : null}
              {payload?.developer ? (
                <p className="mt-3 text-body font-bold text-gray-500">
                  {payload.developer.name} · {payload.developer.yearsOfExperience}년 · {payload.developer.targetRoles.join(", ")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/employee/companies" className="rounded-full border border-gray-200 px-4 py-2 text-body font-bold text-gray-600 hover:border-bridge-primary hover:text-ink">
                채용중인 회사 보기
              </Link>
              <Link href="/employee/portfolio" className="rounded-full bg-bridge-primary px-4 py-2 text-body font-bold text-white hover:opacity-90">
                내 포트폴리오
              </Link>
            </div>
          </div>

          {payload?.aiEvaluation ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryStat
                label="AI 상태"
                value={payload.aiEvaluation.geminiConfigured ? "Gemini 연결됨" : "Fallback 모드"}
                tone={payload.aiEvaluation.geminiConfigured ? "teal" : "amber"}
              />
              <SummaryStat
                label="평가 대상"
                value={`${payload.aiEvaluation.evaluatedCompanyCount}개 회사`}
              />
              <SummaryStat
                label="Gemini 반영"
                value={`${payload.aiEvaluation.geminiUsedCount}개`}
              />
              <SummaryStat
                label="Fallback"
                value={`${payload.aiEvaluation.fallbackCount}개`}
              />
            </div>
          ) : null}
        </header>

        {!payload?.authenticated || !recommendations.length ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-panel">
            <p className="text-body font-bold text-bridge-teal">추천 직무를 준비하려면 포트폴리오 저장이 필요합니다.</p>
            <p className="mt-2 text-body text-gray-500">{payload?.message ?? "로그인 후 포트폴리오를 저장하면 API가 현재 사용자 기준 추천을 계산합니다."}</p>
            <Link href="/employee/portfolio" className="mt-5 inline-flex rounded-full bg-bridge-primary px-5 py-3 text-body font-black text-white hover:opacity-90">
              포트폴리오 저장하기
            </Link>
          </section>
        ) : (
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)]">
            <section className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
                <div>
                  <p className="text-body font-bold text-bridge-teal">매칭률 상위 포지션</p>
                  <h2 className="mt-1 text-h1 font-black text-ink">상위 추천 직무</h2>
                </div>
                <span className="text-body font-bold text-gray-400">Top {recommendations.length}</span>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                {recommendations.map((recommendation, index) => {
                  const company = companiesByRoleId.get(recommendation.roleId);
                  if (!company) return null;

                  return (
                    <RecommendationCard
                      key={recommendation.roleId}
                      recommendation={recommendation}
                      company={company}
                      index={index}
                      selected={recommendation.roleId === selectedRecommendation?.roleId}
                      onSelect={() => setSelectedRoleId(recommendation.roleId)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
              {selectedRecommendation && selectedCompany ? (
                <RoleDetail recommendation={selectedRecommendation} company={selectedCompany} />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-body text-gray-500">
                  왼쪽에서 추천 직무를 선택하세요.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function RoleDetail({ recommendation, company }: { recommendation: DeveloperToCompanyFitResult; company: CompanyJobProfile }) {
  const links = getCompanyLinks(company);

  return (
    <div>
      <div className="flex items-start gap-4">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <p className="text-caption font-black uppercase tracking-widest text-gray-400">선택한 직무</p>
          <h2 className="mt-1 text-h1 font-black text-ink">{recommendation.companyName}</h2>
          <p className="text-body font-bold text-bridge-teal">{recommendation.roleTitle}</p>
          <p className="mt-1 text-caption font-bold text-gray-400">{formatSourceConfidence(company)}</p>
        </div>
        <span className="rounded-full bg-bridge-primary/20 px-3 py-1 text-body font-black text-bridge-teal">
          {Math.round(recommendation.overallFitScore)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-bridge-primary/15 px-3 py-1 text-caption font-black text-bridge-teal">
          다음 액션: {nextStepLabel(recommendation.recommendedNextStep)}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-body md:grid-cols-2">
        <Metric label="근무지" value={formatLocationSummary(company, "확인 필요")} />
        <Metric label="급여 정보" value={formatCompanySalarySummary(company, "확인 필요")} />
        <Metric label="언어 수준" value={formatLanguageSummary(company, "확인 필요")} />
        <Metric label="경력 요건" value={formatExperienceRange(company, "확인 필요")} />
      </dl>

      <div className="mt-5 grid gap-4">
        <InfoPanel title="요구/우대 기술 스택">
          <div className="flex flex-wrap gap-2">
            {formatStacks(company).map((stack) => (
              <span key={stack} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-bold text-gray-500">
                {stack}
              </span>
            ))}
          </div>
        </InfoPanel>

        <InfoPanel title="매칭 사유">
          <BulletList items={recommendation.matchedReasons.slice(0, 6)} fallback="프로필과 직무 조건이 일부 일치합니다." />
        </InfoPanel>

        <InfoPanel title="AI 평가 설명">
          <p>{recommendation.explanation || "현재 포트폴리오 기준 요약 설명이 아직 충분하지 않습니다."}</p>
        </InfoPanel>

        <InfoPanel title="추가 준비 사항">
          <BulletList items={(recommendation.missingSignals.length ? recommendation.missingSignals : ["추가 보강 신호가 많지 않습니다."]).slice(0, 6)} />
        </InfoPanel>

        <InfoPanel title="체크해야 할 리스크">
          <BulletList items={(recommendation.risks.length ? recommendation.risks : ["특별한 리스크가 크게 감지되지 않았습니다."]).slice(0, 4)} />
        </InfoPanel>

        <InfoPanel title="출처">
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gray-200 px-3 py-1 text-caption font-bold text-bridge-teal hover:border-bridge-teal"
              >
                {linkLabel(link.label, link.supports)}
              </a>
            ))}
          </div>
        </InfoPanel>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={`/employee/companies/${company.companyId}`} className="rounded-full bg-bridge-primary px-4 py-2 text-body font-bold text-white hover:opacity-90 shadow-sm">
          회사 상세 보기
        </Link>
        <Link href="/employee/portfolio" className="rounded-full border border-gray-200 px-4 py-2 text-body font-bold text-gray-600 hover:border-bridge-primary hover:text-ink">
          포트폴리오 수정
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bridge-paper p-3">
      <dt className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</dt>
      <dd className="mt-1 font-bold text-ink">{value}</dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "teal" | "amber";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-bridge-primary/15 text-bridge-teal"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-bridge-paper text-ink";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className={["mt-2 inline-flex rounded-full px-3 py-1 text-body font-black", toneClass].join(" ")}>{value}</p>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="text-caption font-black uppercase tracking-widest text-gray-400">{title}</h3>
      <div className="mt-3 text-body leading-6 text-gray-600">{children}</div>
    </section>
  );
}

function BulletList({ items, fallback }: { items: string[]; fallback?: string }) {
  const values = items.length ? items : fallback ? [fallback] : [];
  return (
    <ul className="space-y-2">
      {values.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}
