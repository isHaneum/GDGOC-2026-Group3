'use client';

import { useEffect, useState } from "react";

const PORTFOLIO_DRAFT_KEY = "bridge_applicant_portfolio_draft";

type PortfolioDraft = {
  fullName: string;
  birthDate: string;
  gender: string;
  education: string;
  career: string;
  techStack: string;
  selfIntroduction: string;
};

const emptyDraft: PortfolioDraft = {
  fullName: "",
  birthDate: "",
  gender: "",
  education: "",
  career: "",
  techStack: "",
  selfIntroduction: ""
};

function readDraft(): PortfolioDraft {
  if (typeof window === "undefined") return emptyDraft;

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_DRAFT_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<PortfolioDraft>) };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: PortfolioDraft) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PORTFOLIO_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export default function PortfolioForm({
  title = "포트폴리오 작성",
  description = "지원자 프로필에 필요한 기본 포트폴리오 정보를 정리합니다."
}: {
  title?: string;
  description?: string;
}) {
  const [draft, setDraft] = useState<PortfolioDraft>(emptyDraft);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  function updateDraft(field: keyof PortfolioDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedAt("");
  }

  function handleSave() {
    writeDraft(draft);
    setSavedAt(new Date().toLocaleString());
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">
            Applicant Portfolio
          </p>
          <h1 className="mt-2 text-2xl font-black text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        </header>

        <section className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
          <Field label="이름" value={draft.fullName} onChange={(value) => updateDraft("fullName", value)} />
          <Field
            label="생년월일"
            type="date"
            value={draft.birthDate}
            onChange={(value) => updateDraft("birthDate", value)}
          />
          <Field label="성별" value={draft.gender} onChange={(value) => updateDraft("gender", value)} />
          <Field label="기술 스택" value={draft.techStack} onChange={(value) => updateDraft("techStack", value)} />
          <Textarea label="학력" value={draft.education} onChange={(value) => updateDraft("education", value)} />
          <Textarea label="경력" value={draft.career} onChange={(value) => updateDraft("career", value)} />
          <div className="md:col-span-2">
            <Textarea
              label="자기소개"
              value={draft.selfIntroduction}
              onChange={(value) => updateDraft("selfIntroduction", value)}
              rows={7}
            />
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-bridge-primary px-5 py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90"
          >
            Save portfolio
          </button>
          {savedAt ? (
            <span className="text-sm font-bold text-bridge-teal">Saved locally at {savedAt}</span>
          ) : (
            <span className="text-sm text-gray-400">저장 전까지 브라우저 임시 상태로만 유지됩니다.</span>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 5
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm leading-6 text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}

