'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  loadCompanyJobProfiles,
  loadSampleDeveloperProfiles
} from "../../src/lib/companyCriteria";
import {
  formatCompanySalarySummary,
  formatCompanyLogo,
  formatExperienceRange,
  formatLanguageSummary,
  formatLocationSummary,
} from "../../src/lib/fitDisplayHelpers";
import { type BridgeUserRole, readBridgeUserRole } from "../../src/lib/roleStorage";
import { translateText } from "../../src/lib/translationService";
import type { CompanyJobProfile, DeveloperPreference } from "../../shared/companyCriteriaTypes";

type LoadState = "loading" | "ready" | "error";
type Locale = "ko" | "ja" | "en";
type CompanyJobProfileDisplay = CompanyJobProfile & { missingFields?: string[] };

async function translateDraft(text: string, targetLocale: Locale) {
  const result = await translateText({
    text,
    sourceLocale: "auto",
    targetLocale,
    context: "resume"
  });

  return {
    translatedText: result.translatedText,
    provider: result.provider
  };
}

function formatList(values: string[], fallback = "확인 필요") {
  return values.length ? values.join(", ") : fallback;
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

function buildMissingEvidence(developer: DeveloperPreference | null, company: CompanyJobProfile | null, draft: string): string[] {
  if (!developer || !company) return [];

  const displayCompany = company as CompanyJobProfileDisplay;
  const developerTech = new Set(developer.availableTechStacks.map((stack) => stack.toLowerCase()));
  const developerLanguages = new Set(developer.languageCertifications.map((item) => item.language.toLowerCase()));
  const missingTech = company.requiredTechStacks.filter((stack) => !developerTech.has(stack.toLowerCase())).slice(0, 4);
  const missingLanguages = company.requiredLanguages.filter((item) => !developerLanguages.has(item.language.toLowerCase()));
  const missing: string[] = [];

  if (missingTech.length) missing.push(`필수 기술 근거 보강: ${missingTech.join(", ")}`);
  if (missingLanguages.length) missing.push(`언어 조건 근거 보강: ${missingLanguages.map((item) => `${item.language} ${item.level}`).join(", ")}`);
  if (typeof company.experienceRange.minYears === "number" && developer.yearsOfExperience < company.experienceRange.minYears) {
    missing.push(`경력 요구 범위 확인: ${company.experienceRange.minYears}년 이상 근거 필요`);
  }
  if (!draft.trim()) missing.push("지원 동기 초안 작성 필요");
  if (displayCompany.missingFields?.includes("salary")) missing.push("연봉 정보는 공식 공고에서 확인 필요");

  return missing.length ? missing : ["핵심 근거가 준비되어 있습니다. 회사별 표현만 더 구체화하세요."];
}

function rewriteForCompany(developer: DeveloperPreference | null, company: CompanyJobProfile | null, draft: string) {
  if (!developer || !company) return "";

  const matchedTech = developer.availableTechStacks.filter((stack) =>
    [...company.requiredTechStacks, ...company.preferredTechStacks].some((required) => required.toLowerCase() === stack.toLowerCase())
  );
  const motivation = draft.trim() || developer.motivation || "지원 동기를 입력하면 회사 기준에 맞춰 더 구체화할 수 있습니다.";

  return [
    `안녕하세요. ${company.companyName}의 ${company.roleTitle} 포지션에 지원하는 ${developer.name}입니다.`,
    `${motivation}`,
    matchedTech.length
      ? `특히 ${matchedTech.slice(0, 4).join(", ")} 경험을 바탕으로 ${company.companyName}의 ${company.roleCategory} 업무에 빠르게 기여할 수 있습니다.`
      : `${company.companyName}의 직무 요구사항을 기준으로 프로젝트 경험과 학습 근거를 더 명확히 정리하겠습니다.`,
    `근무지와 언어 조건은 ${formatLocationSummary(company, "위치 확인 필요")} / ${formatLanguageSummary(company, "언어 조건 확인 필요")} 기준으로 확인하고, 부족한 근거는 포트폴리오와 면접 준비에서 보강하겠습니다.`
  ].join("\n\n");
}

export default function ApplyPage() {
  const [roleResolved, setRoleResolved] = useState(false);
  const [currentRole, setCurrentRole] = useState<BridgeUserRole | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [developers, setDevelopers] = useState<DeveloperPreference[]>([]);
  const [companies, setCompanies] = useState<CompanyJobProfile[]>([]);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [draft, setDraft] = useState("");
  const [rewritten, setRewritten] = useState("");
  const [copyState, setCopyState] = useState("");
  const [translationProvider, setTranslationProvider] = useState("");

  useEffect(() => {
    setCurrentRole(readBridgeUserRole());
    setRoleResolved(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [nextDevelopers, nextCompanies] = await Promise.all([
          loadSampleDeveloperProfiles(),
          loadCompanyJobProfiles()
        ]);
        if (cancelled) return;
        setDevelopers(nextDevelopers);
        setCompanies(nextCompanies);
        setSelectedDeveloperId(nextDevelopers[0]?.developerId ?? "");
        setSelectedRoleId(nextCompanies[0]?.roleId ?? "");
        setDraft(nextDevelopers[0]?.motivation ?? "");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : "지원서 데이터를 불러오지 못했습니다.");
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
  const selectedCompany = useMemo(
    () => companies.find((company) => company.roleId === selectedRoleId) ?? companies[0] ?? null,
    [companies, selectedRoleId]
  );
  const checklist = useMemo(
    () => buildMissingEvidence(selectedDeveloper, selectedCompany, draft),
    [selectedDeveloper, selectedCompany, draft]
  );

  useEffect(() => {
    setDraft(selectedDeveloper?.motivation ?? "");
    setRewritten("");
    setCopyState("");
    setTranslationProvider("");
  }, [selectedDeveloperId, selectedRoleId, selectedDeveloper]);

  async function handleTranslate(targetLocale: Locale) {
    const baseText = rewritten || rewriteForCompany(selectedDeveloper, selectedCompany, draft);
    const result = await translateDraft(baseText, targetLocale);
    setRewritten(result.translatedText);
    setTranslationProvider(result.provider);
  }

  async function handleCopy() {
    const text = rewritten || rewriteForCompany(selectedDeveloper, selectedCompany, draft);
    await navigator.clipboard.writeText(text);
    setCopyState("복사 완료");
  }

  if (!roleResolved || loadState === "loading") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-gray-500">지원서 데이터를 불러오는 중입니다.</div>;
  }

  if (currentRole === "employer") {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-panel">
          <p className="text-sm font-black uppercase tracking-widest text-bridge-coral">Developer only</p>
          <h1 className="mt-3 text-2xl font-black text-ink">지원서 작성은 개발자용 기능입니다.</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            기업 담당자는 추천 개발자와 지원자 관리 화면에서 후보 흐름을 확인할 수 있습니다.
          </p>
          <Link href="/employer" className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-black">
            기업 홈으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  if (loadState === "error") {
    return <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12 text-center text-bridge-coral">{errorMessage}</div>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-gray-100 bg-white p-6 shadow-panel">
          <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">지원서 작성</p>
          <h1 className="mt-2 text-3xl font-black text-ink">기업 기준에 맞게 지원 동기를 다듬기</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
            선택한 기업과 직무 기준을 보면서 지원 동기를 정리합니다. 외부 AI는 브라우저에서 직접 호출하지 않습니다.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-panel">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">개발자 선택</span>
              <select value={selectedDeveloperId} onChange={(event) => setSelectedDeveloperId(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal">
                {developers.map((developer) => <option key={developer.developerId} value={developer.developerId}>{developer.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">기업 선택 / 직무 선택</span>
              <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal">
                {companies.map((company) => <option key={company.roleId} value={company.roleId}>{company.companyName} / {company.roleTitle}</option>)}
              </select>
            </label>

            {selectedCompany ? (
              <div className="rounded-2xl border border-gray-100 bg-bridge-paper p-4 text-sm text-gray-600">
                <div className="mb-4 flex items-start gap-3">
                  <CompanyLogo company={selectedCompany} />
                  <div>
                    <p className="font-black text-ink">{selectedCompany.companyName}</p>
                    <p className="text-bridge-teal font-bold">{selectedCompany.roleTitle}</p>
                  </div>
                </div>
                <p><span className="font-bold text-ink">지역: </span>{formatLocationSummary(selectedCompany, "위치 확인 필요")}</p>
                <p className="mt-2"><span className="font-bold text-ink">연봉: </span>{formatCompanySalarySummary(selectedCompany, "연봉 확인 필요")}</p>
                <p className="mt-2"><span className="font-bold text-ink">언어: </span>{formatLanguageSummary(selectedCompany, "언어 조건 확인 필요")}</p>
                <p className="mt-2"><span className="font-bold text-ink">경력: </span>{formatExperienceRange(selectedCompany, "경력 확인 필요")}</p>
                <p className="mt-2"><span className="font-bold text-ink">기술: </span>{formatList([...selectedCompany.requiredTechStacks, ...selectedCompany.preferredTechStacks].slice(0, 6))}</p>
              </div>
            ) : null}
          </aside>

          <div className="space-y-6">
            <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-panel md:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-bridge-teal">내 이력서 / 프로필 요약</p>
                <div className="mt-3 rounded-2xl bg-bridge-paper p-4 text-sm leading-6 text-gray-600">
                  <p><span className="font-bold text-ink">이름: </span>{selectedDeveloper?.name}</p>
                  <p><span className="font-bold text-ink">직무: </span>{formatList(selectedDeveloper?.targetRoles ?? [])}</p>
                  <p><span className="font-bold text-ink">기술: </span>{formatList(selectedDeveloper?.availableTechStacks ?? [])}</p>
                  <p><span className="font-bold text-ink">경력: </span>{selectedDeveloper?.yearsOfExperience ?? 0}년</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-bridge-teal">Missing evidence checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  {checklist.map((item) => <li key={item} className="rounded-xl bg-bridge-paper px-3 py-2">{item}</li>)}
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-panel">
              <label className="block">
                <span className="text-sm font-bold text-bridge-teal">지원 동기</span>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={7} className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal" />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setRewritten(rewriteForCompany(selectedDeveloper, selectedCompany, draft))} className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-black">
                  이 회사에 맞게 다듬기
                </button>
                <button type="button" onClick={() => handleTranslate("ja")} className="rounded-xl bg-bridge-primary px-4 py-2 text-sm font-bold text-ink hover:opacity-90">
                  일본어로 번역
                </button>
                <button type="button" onClick={() => handleTranslate("ko")} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:text-ink">
                  한국어로 번역
                </button>
                <button type="button" onClick={() => handleTranslate("en")} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:text-ink">
                  영어로 번역
                </button>
                <button type="button" onClick={handleCopy} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:text-ink">
                  복사하기
                </button>
              </div>
              {translationProvider ? <p className="mt-2 text-xs text-gray-400">translation provider: {translationProvider}</p> : null}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-panel">
              <p className="text-sm font-bold text-bridge-teal">Company-specific rewrite</p>
              <pre className="mt-3 min-h-64 whitespace-pre-wrap rounded-2xl bg-bridge-paper p-4 text-sm leading-6 text-gray-700">
                {rewritten || rewriteForCompany(selectedDeveloper, selectedCompany, draft)}
              </pre>
              {copyState ? <p className="mt-2 text-sm font-bold text-bridge-teal">{copyState}</p> : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
