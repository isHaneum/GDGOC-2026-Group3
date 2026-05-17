'use client';

import { Link } from "@i18n/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

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

function formatStacks(company: CompanyJobProfile, fallback: string) {
  const stacks = unique([...company.requiredTechStacks, ...company.preferredTechStacks]);
  return stacks.length ? stacks.slice(0, 10) : [fallback];
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
  const t = useTranslations("employee");

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

          <div className="mt-3 grid gap-2 text-body text-gray-600 md:grid-cols-2">
            <p><span className="font-bold text-ink">{t("location")}: </span>{formatLocationSummary(company, t("needsCheck"))}</p>
            <p><span className="font-bold text-ink">{t("salary")}: </span>{formatCompanySalarySummary(company, t("needsCheck"))}</p>
          </div>

          <p className="mt-3 text-body leading-6 text-gray-600">
            {recommendation.matchedReasons[0] ?? t("matchFallback")}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function EmployeeRecommendsPage() {
  const t = useTranslations("employee");
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
        const nextPayload = await fetchEmployeeRecommendations(t("recommendLoadFailed"));
        if (cancelled) return;
        setPayload(nextPayload);
        writeCachedEmployeeRecommendations(nextPayload);
        setSelectedRoleId((current) => current || nextPayload.recommendations[0]?.roleId || "");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : t("recommendLoadFailed"));
        if (!cached) setLoadState("error");
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [t]);

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
  const emptyRecommendationMessage = !payload?.authenticated
    ? t("recommendLoginRequired")
    : t("portfolioRequiredBody");

  if (loadState === "loading") {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">{t("recommendLoading")}</main>;
  }

  if (loadState === "error") {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-bridge-coral">{errorMessage}</main>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] overflow-hidden bg-bridge-paper px-4 py-8">
      <div className="mx-auto flex max-h-[calc(100vh-112px)] max-w-7xl flex-col gap-5">
        <header className="shrink-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">{t("recommendGuideEyebrow")}</p>
              <h1 className="mt-2 text-h1 font-black tracking-tight text-ink">{t("recommendTitle")}</h1>
              <p className="mt-2 max-w-3xl text-body leading-6 text-gray-500">
                {t("recommendDescription")}
              </p>
              {payload?.developer ? (
                <p className="mt-3 text-body font-bold text-gray-500">
                  {payload.developer.name} · {t("yearsOfExperience", { years: payload.developer.yearsOfExperience })} · {payload.developer.targetRoles.join(", ")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/employee/companies" className="rounded-full border border-gray-200 px-4 py-2 text-body font-bold text-gray-600 hover:border-bridge-primary hover:text-ink">
                {t("viewCompanies")}
              </Link>
              <Link href="/employee/portfolio" className="rounded-full bg-bridge-primary px-4 py-2 text-body font-bold text-white hover:opacity-90">
                {t("portfolioTitle")}
              </Link>
            </div>
          </div>
        </header>

        {!payload?.authenticated || !recommendations.length ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-panel">
            <p className="text-body font-bold text-bridge-teal">{t("portfolioRequiredTitle")}</p>
            <p className="mt-2 text-body text-gray-500">{emptyRecommendationMessage}</p>
            <Link href="/employee/portfolio" className="mt-5 inline-flex rounded-full bg-bridge-primary px-5 py-3 text-body font-black text-white hover:opacity-90">
              {t("savePortfolio")}
            </Link>
          </section>
        ) : (
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)]">
            <section className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
                <div>
                  <p className="text-body font-bold text-bridge-teal">{t("topMatchPositions")}</p>
                  <h2 className="mt-1 text-h1 font-black text-ink">{t("recommendsTitle")}</h2>
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
                  {t("selectRolePrompt")}
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
  const t = useTranslations("employee");
  const links = getCompanyLinks(company);

  return (
    <div>
      <div className="flex items-start gap-4">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <p className="text-caption font-black uppercase tracking-widest text-gray-400">{t("selectedRole")}</p>
          <h2 className="mt-1 text-h1 font-black text-ink">{recommendation.companyName}</h2>
          <p className="text-body font-bold text-bridge-teal">{recommendation.roleTitle}</p>
          <p className="mt-1 text-caption font-bold text-gray-400">{formatSourceConfidence(company)}</p>
        </div>
        <span className="rounded-full bg-bridge-primary/20 px-3 py-1 text-body font-black text-bridge-teal">
          {Math.round(recommendation.overallFitScore)}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-body md:grid-cols-2">
        <Metric label={t("workplace")} value={formatLocationSummary(company, t("needsCheck"))} />
        <Metric label={t("salaryInfo")} value={formatCompanySalarySummary(company, t("needsCheck"))} />
        <Metric label={t("languageRequirement")} value={formatLanguageSummary(company, t("needsCheck"))} />
        <Metric label={t("experienceRequirement")} value={formatExperienceRange(company, t("needsCheck"))} />
      </dl>

      <div className="mt-5 grid gap-4">
        <InfoPanel title={t("techStackPanel")}>
          <div className="flex flex-wrap gap-2">
            {formatStacks(company, t("stackMissing")).map((stack) => (
              <span key={stack} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-bold text-gray-500">
                {stack}
              </span>
            ))}
          </div>
        </InfoPanel>

        <InfoPanel title={t("matchReasons")}>
          <BulletList items={recommendation.matchedReasons.slice(0, 6)} fallback={t("matchFallback")} />
        </InfoPanel>

        <InfoPanel title={t("missingSignals")}>
          <BulletList items={(recommendation.missingSignals.length ? recommendation.missingSignals : [t("noAdditionalSignals")]).slice(0, 6)} />
        </InfoPanel>

        <InfoPanel title={t("risks")}>
          <BulletList items={(recommendation.risks.length ? recommendation.risks : [t("noMajorRisks")]).slice(0, 4)} />
        </InfoPanel>

        <InfoPanel title={t("sources")}>
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
          {t("viewCompanyDetail")}
        </Link>
        <Link href="/employee/portfolio" className="rounded-full border border-gray-200 px-4 py-2 text-body font-bold text-gray-600 hover:border-bridge-primary hover:text-ink">
          {t("editPortfolio")}
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
