import Link from "next/link";

import companyJobProfiles from "../../../public/data/company-criteria/companyJobProfiles.json";
import type { CompanyJobProfile } from "../../../shared/companyCriteriaTypes";

const companies = companyJobProfiles as CompanyJobProfile[];

export default function HiringCompaniesPage() {
  const visibleCompanies = companies.slice(0, 24);

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
          {visibleCompanies.map((company) => (
            <article key={`${company.companyId}-${company.roleId}`} className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-panel transition-all hover:border-bridge-primary/30">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink line-clamp-1">{company.companyName}</h2>
                    <p className="mt-1 text-sm font-bold text-bridge-teal line-clamp-1">{company.roleTitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bridge-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-bridge-teal">
                    {company.country}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[...company.requiredTechStacks, ...company.preferredTechStacks].slice(0, 4).map((stack) => (
                    <span key={stack} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">
                      {stack}
                    </span>
                  ))}
                  {!company.requiredTechStacks.length && !company.preferredTechStacks.length ? (
                    <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400">
                      기술 스택 미지정
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 flex items-center text-sm">
                  <div className="text-gray-500 flex items-center gap-2">
                    <span className="font-bold text-ink">
                      {company.experienceRange.minYears}-{company.experienceRange.maxYears ?? "무관"}년
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{company.workStyle}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/employee/companies/${company.companyId}`}
                className="mt-5 flex w-full justify-center rounded-xl bg-bridge-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                상세 보기
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
