import { Link } from "@i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import companyJobProfiles from "@data/company-criteria/companyJobProfiles.json";
import type { CompanyJobProfile } from "@shared/companyCriteriaTypes";
import {
  formatCompanySalarySummary,
  formatExperienceRange,
  formatLanguageSummary,
  formatLocationSummary,
  formatSourceConfidence
} from "@src/lib/fitDisplayHelpers";

const companies = companyJobProfiles as CompanyJobProfile[];

export function generateStaticParams() {
  return [...new Set(companies.map((company) => company.companyId))].map((companyId) => ({ companyId }));
}

export default async function EmployeeCompanyDetailPage({
  params
}: {
  params: Promise<{ locale: string; companyId: string }>;
}) {
  const { locale, companyId } = await params;
  const t = await getTranslations({ locale, namespace: "employee" });
  const roles = companies.filter((company) => company.companyId === companyId);
  const company = roles[0];

  if (!company) notFound();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/employee/companies" className="text-body font-bold text-gray-400 hover:text-bridge-primary transition-colors">
          {t("backCompanies")}
        </Link>

        <header className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
            {t("companyDetail")}
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-h1 font-bold text-ink">{company.companyName}</h1>
              <p className="mt-2 text-body font-bold text-gray-500">
                {company.country} · {company.companyType} · {formatSourceConfidence(company)}
              </p>
            </div>
            <span className="rounded-full bg-bridge-primary/10 px-3 py-1 text-caption font-black text-bridge-teal">
              {t("openRoles", { count: roles.length })}
            </span>
          </div>
        </header>

        <section className="grid gap-4">
          {roles.map((role) => (
            <article key={role.roleId} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-caption font-black uppercase tracking-widest text-gray-400">{role.roleCategory}</p>
                  <h2 className="text-h2 font-bold mb-3">{t("roleIntro")}</h2>
                  <p className="mt-2 text-body leading-6 text-gray-500">
                    {role.notes ?? t("roleFallback")}
                  </p>
                </div>
                <span className="rounded-full bg-bridge-paper px-3 py-1 text-caption font-bold text-gray-500">
                  {role.workStyle}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-body md:grid-cols-4">
                <Metric label="Location" value={formatLocationSummary(role, t("needsCheck"))} />
                <Metric label="Salary" value={formatCompanySalarySummary(role, t("needsCheck"))} />
                <Metric label="Languages" value={formatLanguageSummary(role, t("needsCheck"))} />
                <Metric label="Experience" value={formatExperienceRange(role, t("needsCheck"))} />
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {[...role.requiredTechStacks, ...role.preferredTechStacks].slice(0, 10).map((stack) => (
                  <span key={stack} className="rounded border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-bold text-gray-500">
                    {stack}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bridge-paper p-3">
      <dt className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</dt>
      <dd className="mt-1 font-bold text-ink">{value}</dd>
    </div>
  );
}
