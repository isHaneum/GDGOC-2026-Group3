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
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-bridge-teal">
              채용 기업
            </p>
            <h1 className="mt-3 text-2xl font-bold text-ink">더 브릿지에서 채용 중인 기업</h1>
            <p className="mt-3 max-w-2xl text-gray-500 leading-relaxed">
              매칭 엔진에서 사용하는 활성 기업 프로필입니다. 각 카드에서 채용 상황을 명확히 확인한 후 AI 기반 매칭을 시작하세요.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-right shadow-panel">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">채용 중인 포지션</span>
            <span className="text-2xl font-black text-bridge-primary">{companies.length}</span>
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
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          {logo ? (
                            <img
                              src={logo.src}
                              alt={logo.alt}
                              className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 bg-white object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400">
                              {getCompanyInitials(company.companyName)}
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold text-ink line-clamp-1">{company.companyName}</h2>
                            <p className="mt-0.5 text-sm font-bold text-bridge-teal line-clamp-1">{company.roleTitle}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-bridge-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-bridge-teal">
                          {company.country}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {stacks.slice(0, 4).map((stack) => (
                          <span key={stack} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                            {stack}
                          </span>
                        ))}
                        {!stacks.length ? (
                          <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400">
                            기술 스택 미지정
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border border-gray-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-gray-500">경력/방식</span>
                          <span className="font-bold text-ink">
                            {formatExperienceRange(company, "확인 필요")} | {workStyleLabels[company.workStyle]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-500">급여 정보</span>
                          <span className="font-bold text-bridge-primary">
                            {formatCompanySalarySummary(company, "확인 필요")}
                          </span>
                        </div>
                      </div>
                      
                      {links.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-400 transition hover:border-bridge-teal hover:text-bridge-teal"
                            >
                              {getLinkLabel(link.label, link.supports)}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/employee/companies/${company.companyId}`}
                      className="mt-5 flex w-full justify-center rounded-xl bg-bridge-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      상세 보기
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
