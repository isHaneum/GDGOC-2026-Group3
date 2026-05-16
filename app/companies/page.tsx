import companyJobProfiles from "../../public/data/company-criteria/companyJobProfiles.json";
import { formatCompanySalarySummary } from "../../src/lib/fitDisplayHelpers";
import { mergeCompanySalaryDataList } from "../../src/lib/companySalaryEnrichment";
import type { CompanyJobProfile } from "../../shared/companyCriteriaTypes";

const companies = mergeCompanySalaryDataList(companyJobProfiles as CompanyJobProfile[]);

export default function HiringCompaniesPage() {
  const visibleCompanies = companies.slice(0, 24);

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
          {visibleCompanies.map((company) => (
            <article key={`${company.companyId}-${company.roleId}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-ink">{company.companyName}</h2>
                  <p className="mt-1 text-sm font-bold text-bridge-teal">{company.roleTitle}</p>
                </div>
                <span className="rounded-full bg-bridge-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-bridge-teal">
                  {company.country}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[...company.requiredTechStacks, ...company.preferredTechStacks].slice(0, 5).map((stack) => (
                  <span key={stack} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                    {stack}
                  </span>
                ))}
                {!company.requiredTechStacks.length && !company.preferredTechStacks.length ? (
                  <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400">
                    Stack not specified
                  </span>
                ) : null}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Work Style</dt>
                  <dd className="mt-1 font-bold text-ink">{company.workStyle}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Experience</dt>
                  <dd className="mt-1 font-bold text-ink">
                    {company.experienceRange.minYears}-{company.experienceRange.maxYears ?? "any"} yrs
                  </dd>
                </div>
                <div className="col-span-2 rounded-xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salary</dt>
                  <dd className="mt-1 font-bold text-ink">{formatCompanySalarySummary(company, "Confirmation needed")}</dd>
                </div>
              </dl>

              <p className="mt-5 text-sm leading-relaxed text-gray-500">
                {company.notes ?? "This role is available for matching and recruiter-side evaluation."}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
