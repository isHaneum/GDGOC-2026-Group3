'use client';

import { useEffect, useState } from "react";

import {
  clearCachedEmployeeRecommendations,
  fetchEmployeeRecommendations,
  writeCachedEmployeeRecommendations,
} from "@src/lib/employeeRecommendations";
import type { CvContent } from "@shared/types";

const PORTFOLIO_DRAFT_KEY = "bridge_applicant_portfolio_draft";

type SaveState = "idle" | "saving" | "saved" | "localOnly" | "error";

type SaveApiResponse = {
  authenticated?: boolean;
  saved?: boolean;
};

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

function splitList(value: string) {
  return value
    .split(/[,，、\n/;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseYearsOfExperience(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*(?:년|years?|yrs?)/i);
  return match ? Number(match[1]) : null;
}

function inferTargetRoles(draft: PortfolioDraft) {
  const source = `${draft.techStack} ${draft.career} ${draft.selfIntroduction}`.toLowerCase();
  const roles = new Set<string>();

  if (/react|vue|next|frontend|front-end|프론트/.test(source)) roles.add("Frontend Engineer");
  if (/node|spring|django|backend|back-end|api|java|go|python|백엔드/.test(source)) roles.add("Backend Engineer");
  if (/ai|ml|machine learning|data|데이터|인공지능/.test(source)) roles.add("AI/ML Engineer");
  if (/aws|gcp|azure|kubernetes|docker|devops|sre|cloud|클라우드/.test(source)) roles.add("SRE/DevOps Engineer");
  if (/android|ios|swift|kotlin|flutter|react native|mobile|모바일/.test(source)) roles.add("Mobile Engineer");

  return [...roles];
}

function buildProfileUpdates(draft: PortfolioDraft) {
  const yearsOfExperience = parseYearsOfExperience(draft.career);
  const targetRoles = inferTargetRoles(draft);
  const updates: Record<string, unknown> = {
    full_name: draft.fullName.trim() || null,
    tech_stack: splitList(draft.techStack),
    self_introduction: draft.selfIntroduction.trim() || null,
    key_project_experience: draft.career.trim() || null,
  };

  if (yearsOfExperience !== null) updates.years_of_experience = yearsOfExperience;
  if (targetRoles.length) {
    updates.target_role = targetRoles[0];
    updates.target_roles = targetRoles;
  }

  return updates;
}

function buildCvContents(draft: PortfolioDraft): CvContent[] {
  return [
    { name: "Education", content: draft.education },
    { name: "Career", content: draft.career },
    { name: "Tech Stack", content: draft.techStack },
    { name: "Self Introduction", content: draft.selfIntroduction },
  ]
    .map((item) => ({ ...item, content: item.content.trim() }))
    .filter((item) => item.content);
}

async function putJson(path: string, body: unknown): Promise<SaveApiResponse> {
  const response = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) throw new Error("포트폴리오를 저장하지 못했습니다.");
  return response.json() as Promise<SaveApiResponse>;
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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  function updateDraft(field: keyof PortfolioDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedAt("");
    setSaveState("idle");
    setStatusMessage("");
  }

  async function refreshRecommendations() {
    try {
      const recommendations = await fetchEmployeeRecommendations();
      writeCachedEmployeeRecommendations(recommendations);
      setSaveState("saved");
      setStatusMessage("DB 저장과 추천 직무 갱신이 완료되었습니다.");
    } catch {
      setStatusMessage("DB 저장은 완료되었습니다. 추천 직무는 추천 탭에서 다시 갱신됩니다.");
    }
  }

  async function handleSave() {
    setSaveState("saving");
    setStatusMessage("포트폴리오를 저장하고 추천 직무를 준비하고 있습니다.");
    writeDraft(draft);
    clearCachedEmployeeRecommendations();
    setSavedAt(new Date().toLocaleString());

    try {
      const [profileResult, cvResult] = await Promise.all([
        putJson("/api/developer/profile", buildProfileUpdates(draft)),
        putJson("/api/developer/cv", { contents: buildCvContents(draft) }),
      ]);

      if (!profileResult.authenticated || !profileResult.saved || !cvResult.authenticated || !cvResult.saved) {
        setSaveState("localOnly");
        setStatusMessage("로컬에 저장되었습니다. 로그인 세션이나 Supabase 환경이 준비되면 DB 추천도 갱신됩니다.");
        return;
      }

      setSaveState("saved");
      setStatusMessage("DB 저장 완료. 추천 직무를 갱신하고 있습니다.");
      void refreshRecommendations();
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "포트폴리오를 저장하지 못했습니다.");
    }
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
            disabled={saveState === "saving"}
            className="rounded-full bg-bridge-primary px-5 py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState === "saving" ? "저장 중" : "포트폴리오 저장"}
          </button>
          {statusMessage ? (
            <span className={["text-sm font-bold", saveState === "error" ? "text-bridge-coral" : "text-bridge-teal"].join(" ")}>{statusMessage}</span>
          ) : savedAt ? (
            <span className="text-sm font-bold text-bridge-teal">로컬 저장 완료: {savedAt}</span>
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

