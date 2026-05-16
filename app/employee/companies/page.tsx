import Link from "next/link";

import companyJobProfiles from "../../../public/data/company-criteria/companyJobProfiles.json";
import {
  formatCompanyLogo,
  formatCompanySalarySummary,
  formatExperienceRange,
  formatLanguageSummary,
  formatLocationSummary,
} from "../../../src/lib/fitDisplayHelpers";
import { mergeCompanySalaryDataList } from "../../../src/lib/companySalaryEnrichment";
import type { CompanyJobProfile } from "../../../shared/companyCriteriaTypes";

const companies = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[]);

const workStyleLabels: Record<CompanyJobProfile["workStyle"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Not specified",
};

function getCompanyStacks(company: CompanyJobProfile): string[] {
  return [...new Set([...company.requiredTechStacks, ...company.preferredTechStacks])].slice(0, 6);
}

function getCompanyLinks(company: CompanyJobProfile): Array<{ label: string; url: string; supports?: string }> {
  const links = company.salarySourceLinks ?? [];
  if (links.length) {
    return links.slice(0, 4);
  }

  return (company.sourceUrls ?? []).slice(0, 4).map((url) => ({
    label: new URL(url).hostname.replace(/^www\./, ""),
    url,
  }));
}

function getLinkLabel(label?: string, supports?: string): string {
  if (supports === "officialWebsite") return "Official site";
  if (supports === "careers") return "Careers";
  if (supports?.includes("newGraduate")) return "Salary details";
  if (supports?.includes("averageAnnual") || supports?.includes("averageTenure")) return "Salary source";
  return label ?? "Source";
}

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function HiringCompaniesPage() {
  return (
    <main className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-bridge-teal">
              Hiring Companies
            </p>
            <h1 className="mt-3 text-4xl font-black text-ink">Companies Recruiting Across The Bridge</h1>
            <p className="mt-3 max-w-2xl text-gray-500 leading-relaxed">
              Browse active company profiles used by the matching engine. Each card keeps the recruiting context clear
              before a developer opens the AI-assisted fit flow.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-3 text-right shadow-panel">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Open roles</span>
            <span className="text-2xl font-black text-bridge-primary">{companies.length}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <article key={`${company.companyId}-${company.roleId}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
              {(() => {
                const stacks = getCompanyStacks(company);
                const links = getCompanyLinks(company);
                const logo = formatCompanyLogo(company);

                return (
                  <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  {logo ? (
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-14 w-24 shrink-0 rounded-xl border border-gray-100 bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm font-black text-gray-400">
                      {getCompanyInitials(company.companyName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-ink">{company.companyName}</h2>
                    <p className="mt-1 text-sm font-bold text-bridge-teal">{company.roleTitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-bridge-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-bridge-teal">
                  {company.country}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {stacks.map((stack) => (
                  <span key={stack} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                    {stack}
                  </span>
                ))}
                {!stacks.length ? (
                  <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400">
                    Stack not publicly specified
                  </span>
                ) : null}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</dt>
                  <dd className="mt-1 font-bold text-ink">{formatLocationSummary(company, company.country)}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Work Style</dt>
                  <dd className="mt-1 font-bold text-ink">{workStyleLabels[company.workStyle]}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Experience</dt>
                  <dd className="mt-1 font-bold text-ink">{formatExperienceRange(company, "Confirmation needed")}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Language</dt>
                  <dd className="mt-1 font-bold text-ink">{formatLanguageSummary(company, "Not publicly specified")}</dd>
                </div>
                <div className="col-span-2 rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salary</dt>
                  <dd className="mt-1 font-bold text-ink">{formatCompanySalarySummary(company, "Confirmation needed")}</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl border border-gray-100 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sources</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-bridge-teal transition hover:border-bridge-teal hover:bg-bridge-primary/10"
                    >
                      {getLinkLabel(link.label, link.supports)}
                    </a>
                  ))}
                </div>
              </div>
              <Link
                href={`/employee/companies/${company.companyId}`}
                className="mt-5 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-sm font-bold text-ink transition-opacity hover:opacity-90"
              >
                View Company
              </Link>
                  </>
                );
              })()}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
