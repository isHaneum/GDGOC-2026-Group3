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
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-micro font-black uppercase tracking-[0.3em] text-bridge-teal">
              채용 기업
            </p>
            <h1 className="mt-3 text-h1 font-bold text-ink">더 브릿지에서 채용 중인 기업</h1>
            <p className="mt-3 max-w-2xl text-gray-500 leading-relaxed">
              매칭 엔진에서 사용하는 활성 기업 프로필입니다. 각 카드에서 채용 상황을 명확히 확인한 후 AI 기반 매칭을 시작하세요.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-right shadow-panel">
            <span className="block text-micro font-black uppercase tracking-widest text-gray-400">채용 중인 포지션</span>
            <span className="text-h1 font-black text-bridge-primary">{companies.length}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <article key={`${company.companyId}-${company.roleId}`} className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-panel transition-all hover:border-bridge-primary/30">
              {(() => {
                const stacks = getCompanyStacks(company);
                const logo = formatCompanyLogo(company);
                const links = getCompanyLinks(company);
                
                return (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          {logo ? (
                            <img
                              src={logo.src}
                              alt={logo.alt}
                              className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 bg-white object-contain p-1.5 shadow-sm"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-caption font-black text-gray-400 shadow-sm">
                              {getCompanyInitials(company.companyName)}
                            </div>
                          )}
                          <div className="mt-0.5">
                            <h2 className="text-h2 font-black tracking-tight text-ink line-clamp-1">{company.companyName}</h2>
                            <p className="mt-0.5 text-body font-bold text-bridge-teal line-clamp-1">{company.roleTitle}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-bridge-primary/10 px-2.5 py-1 text-micro font-black uppercase tracking-widest text-bridge-teal mt-1">
                          {company.country}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {stacks.slice(0, 4).map((stack) => (
                          <span key={stack} className="rounded-md border border-gray-100 bg-white px-2 py-1 text-micro font-bold text-gray-500 shadow-sm">
                            {stack}
                          </span>
                        ))}
                        {!stacks.length ? (
                          <span className="rounded-md border border-gray-100 bg-white px-2 py-1 text-micro font-bold text-gray-400 shadow-sm">
                            기술 스택 미지정
                          </span>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-caption">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="font-bold text-gray-400">경력/방식</span>
                          <span className="font-bold text-ink">
                            {formatExperienceRange(company, "확인 필요")} <span className="text-gray-300 font-normal mx-1">|</span> {workStyleLabels[company.workStyle]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/60">
                          <span className="font-bold text-gray-400">급여 요약</span>
                          <span className="font-black text-bridge-primary text-caption">
                            {formatCompanySalarySummary(company, "확인 필요")}
                          </span>
                        </div>
                      </div>
                      
                      {links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-micro font-bold text-gray-400 shadow-sm transition hover:border-bridge-teal hover:text-bridge-teal"
                            >
                              {getLinkLabel(link.label, link.supports)}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50">
                      <Link
                        href={`/employee/companies/${company.companyId}`}
                        className="flex w-full justify-center rounded-xl bg-bridge-primary px-4 py-3 text-body font-black text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        상세 보기
                      </Link>
                    </div>
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
