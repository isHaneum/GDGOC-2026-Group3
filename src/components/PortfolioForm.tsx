'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearCachedEmployeeRecommendations,
  fetchEmployeeRecommendations,
  writeCachedEmployeeRecommendations,
} from "@src/lib/employeeRecommendations";

const PORTFOLIO_DRAFT_KEY = "bridge_employee_portfolio_draft";

type SaveState = "idle" | "saving" | "saved" | "error";

type SaveApiResponse = {
  authenticated?: boolean;
  saved?: boolean;
};

type EmployeeProfileDraft = {
  fullName: string;
  birthDate: string;
  gender: "male" | "female";
  nationality: "korean" | "japanese";
  yearsOfExperience: string;
  targetRoles: string;
  techStack: string;
  languageCertifications: string;
  preferredSalaryMin: string;
  preferredSalaryMax: string;
  preferredCurrency: "KRW" | "JPY";
  preferredLocations: string;
  preferredCompanyTypes: string;
  workStylePreference: "remote" | "hybrid" | "onsite" | "any";
  relocationAvailable: boolean;
  visaSupportNeeded: boolean;
  selfIntroduction: string;
  keyProjectExperience: string;
  motivation: string;
  concerns: string;
  githubUrl: string;
};

const emptyDraft: EmployeeProfileDraft = {
  fullName: "",
  birthDate: "",
  gender: "male",
  nationality: "korean",
  yearsOfExperience: "",
  targetRoles: "",
  techStack: "",
  languageCertifications: "",
  preferredSalaryMin: "",
  preferredSalaryMax: "",
  preferredCurrency: "JPY",
  preferredLocations: "",
  preferredCompanyTypes: "",
  workStylePreference: "hybrid",
  relocationAvailable: false,
  visaSupportNeeded: false,
  selfIntroduction: "",
  keyProjectExperience: "",
  motivation: "",
  concerns: "",
  githubUrl: "",
};

function readDraft(): EmployeeProfileDraft {
  if (typeof window === "undefined") return emptyDraft;

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_DRAFT_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<EmployeeProfileDraft>) };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: EmployeeProfileDraft) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PORTFOLIO_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

function toList(value: string) {
  return value
    .split(/[,，、\n/;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPositiveNumber(value: string, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} 값을 다시 확인해주세요.`);
  }
  return number;
}

function buildPayload(draft: EmployeeProfileDraft) {
  const preferredSalaryMin = toPositiveNumber(draft.preferredSalaryMin, "희망 최소 연봉");
  const preferredSalaryMax = toPositiveNumber(draft.preferredSalaryMax, "희망 최대 연봉");

  if (preferredSalaryMax < preferredSalaryMin) {
    throw new Error("희망 최대 연봉은 최소 연봉보다 크거나 같아야 합니다.");
  }

  return {
    full_name: draft.fullName.trim(),
    birth_date: draft.birthDate,
    gender: draft.gender,
    nationality: draft.nationality,
    years_of_experience: toPositiveNumber(draft.yearsOfExperience, "총 경력"),
    target_roles: toList(draft.targetRoles),
    tech_stack: toList(draft.techStack),
    language_certifications: draft.languageCertifications.trim(),
    preferred_salary_min: preferredSalaryMin,
    preferred_salary_max: preferredSalaryMax,
    preferred_currency: draft.preferredCurrency,
    preferred_locations: toList(draft.preferredLocations),
    preferred_company_types: toList(draft.preferredCompanyTypes),
    work_style_preference: draft.workStylePreference,
    relocation_available: draft.relocationAvailable,
    visa_support_needed: draft.visaSupportNeeded,
    self_introduction: draft.selfIntroduction.trim(),
    key_project_experience: draft.keyProjectExperience.trim(),
    motivation: draft.motivation.trim(),
    concerns: draft.concerns.trim(),
    github_url: draft.githubUrl.trim(),
  };
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
  description = "지원자 프로필 스키마에 필요한 모든 정보를 입력합니다."
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<EmployeeProfileDraft>(emptyDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  function updateDraft<K extends keyof EmployeeProfileDraft>(field: K, value: EmployeeProfileDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
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
      setSaveState("saved");
      setStatusMessage("DB 저장이 완료되었습니다. 추천 직무는 추천 탭에서 다시 갱신됩니다.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setStatusMessage("포트폴리오를 DB에 저장하고 있습니다.");
    writeDraft(draft);
    clearCachedEmployeeRecommendations();

    try {
      const payload = buildPayload(draft);
      const profileResult = await putJson("/api/employee/profile", payload);

      if (!profileResult.authenticated || !profileResult.saved) {
        throw new Error("로그인 세션이 없어 DB 저장을 완료하지 못했습니다.");
      }

      setSaveState("saved");
      setStatusMessage("DB 저장 완료. 회사 목록으로 이동합니다.");
      void refreshRecommendations();
      router.replace("/employee/companies");
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "포트폴리오를 저장하지 못했습니다.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <form className="mx-auto max-w-5xl space-y-5" onSubmit={handleSubmit}>
        <header className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
            Applicant Portfolio
          </p>
          <h1 className="mt-2 text-h1 font-black text-ink">{title}</h1>
          <p className="mt-2 text-body leading-6 text-gray-500">{description}</p>
        </header>

        <section className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
          <Field label="이름" value={draft.fullName} onChange={(value) => updateDraft("fullName", value)} required />
          <Field
            label="생년월일"
            type="date"
            value={draft.birthDate}
            onChange={(value) => updateDraft("birthDate", value)}
            required
          />
          <SelectField
            label="성별"
            value={draft.gender}
            onChange={(value) => updateDraft("gender", value as EmployeeProfileDraft["gender"])}
            options={[
              { value: "male", label: "남성" },
              { value: "female", label: "여성" },
            ]}
          />
          <SelectField
            label="국적"
            value={draft.nationality}
            onChange={(value) => updateDraft("nationality", value as EmployeeProfileDraft["nationality"])}
            options={[
              { value: "korean", label: "한국" },
              { value: "japanese", label: "일본" },
            ]}
          />
          <Field
            label="총 경력(년)"
            type="number"
            value={draft.yearsOfExperience}
            onChange={(value) => updateDraft("yearsOfExperience", value)}
            required
          />
          <Field
            label="희망 직무"
            value={draft.targetRoles}
            onChange={(value) => updateDraft("targetRoles", value)}
            placeholder="예: Frontend Engineer, Fullstack Engineer"
            required
          />
          <Field
            label="기술 스택"
            value={draft.techStack}
            onChange={(value) => updateDraft("techStack", value)}
            placeholder="예: React, Next.js, TypeScript"
            required
          />
          <Field
            label="어학/자격"
            value={draft.languageCertifications}
            onChange={(value) => updateDraft("languageCertifications", value)}
            placeholder="예: Japanese JLPT N2"
            required
          />
          <Field
            label="희망 최소 연봉"
            type="number"
            value={draft.preferredSalaryMin}
            onChange={(value) => updateDraft("preferredSalaryMin", value)}
            required
          />
          <Field
            label="희망 최대 연봉"
            type="number"
            value={draft.preferredSalaryMax}
            onChange={(value) => updateDraft("preferredSalaryMax", value)}
            required
          />
          <SelectField
            label="희망 통화"
            value={draft.preferredCurrency}
            onChange={(value) => updateDraft("preferredCurrency", value as EmployeeProfileDraft["preferredCurrency"])}
            options={[
              { value: "JPY", label: "JPY" },
              { value: "KRW", label: "KRW" },
            ]}
          />
          <Field
            label="희망 근무 지역"
            value={draft.preferredLocations}
            onChange={(value) => updateDraft("preferredLocations", value)}
            placeholder="예: Tokyo, Osaka"
            required
          />
          <Field
            label="선호 기업 유형"
            value={draft.preferredCompanyTypes}
            onChange={(value) => updateDraft("preferredCompanyTypes", value)}
            placeholder="예: SaaS, Marketplace, Enterprise"
            required
          />
          <SelectField
            label="근무 형태 선호"
            value={draft.workStylePreference}
            onChange={(value) => updateDraft("workStylePreference", value as EmployeeProfileDraft["workStylePreference"])}
            options={[
              { value: "remote", label: "원격" },
              { value: "hybrid", label: "하이브리드" },
              { value: "onsite", label: "출근" },
              { value: "any", label: "상관없음" },
            ]}
          />

          <div className="md:col-span-2 grid gap-3 rounded-xl bg-bridge-paper p-4 sm:grid-cols-2">
            <CheckboxField
              label="이주 가능 여부"
              checked={draft.relocationAvailable}
              onChange={(checked) => updateDraft("relocationAvailable", checked)}
            />
            <CheckboxField
              label="비자 지원 필요 여부"
              checked={draft.visaSupportNeeded}
              onChange={(checked) => updateDraft("visaSupportNeeded", checked)}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="자기소개"
              value={draft.selfIntroduction}
              onChange={(value) => updateDraft("selfIntroduction", value)}
              rows={6}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="핵심 프로젝트 경험"
              value={draft.keyProjectExperience}
              onChange={(value) => updateDraft("keyProjectExperience", value)}
              rows={6}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="지원 동기"
              value={draft.motivation}
              onChange={(value) => updateDraft("motivation", value)}
              rows={5}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="우려 사항 / 보완점"
              value={draft.concerns}
              onChange={(value) => updateDraft("concerns", value)}
              rows={5}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Field
              label="GitHub URL"
              type="url"
              value={draft.githubUrl}
              onChange={(value) => updateDraft("githubUrl", value)}
              placeholder="https://github.com/username"
              required
            />
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saveState === "saving"}
            className="rounded-full bg-bridge-primary px-5 py-2.5 text-body font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState === "saving" ? "저장 중" : "포트폴리오 저장"}
          </button>
          {statusMessage ? (
            <span className={["text-body font-bold", saveState === "error" ? "text-bridge-coral" : "text-bridge-teal"].join(" ")}>
              {statusMessage}
            </span>
          ) : (
            <span className="text-body text-gray-400">입력 중인 내용은 브라우저 임시 저장과 함께 DB 저장 시도에 사용됩니다.</span>
          )}
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-body text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-body text-ink outline-none focus:border-bridge-teal"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-bridge-primary focus:ring-bridge-primary"
      />
      <span className="text-body font-semibold text-ink">{label}</span>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-caption font-black uppercase tracking-widest text-gray-400">{label}</span>
      <textarea
        required={required}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-body leading-6 text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}
