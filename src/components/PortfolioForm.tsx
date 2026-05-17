'use client';

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@i18n/navigation";

import {
  clearCachedEmployeeRecommendations,
  fetchEmployeeRecommendations,
  writeCachedEmployeeRecommendations,
} from "@src/lib/employeeRecommendations";

const PORTFOLIO_DRAFT_KEY = "bridge_employee_portfolio_draft";

type DbEmployeeProfile = {
  full_name: string;
  birth_date: string;
  gender: "male" | "female";
  nationality: "korean" | "japanese";
  years_of_experience: number;
  target_roles: string[];
  tech_stack: string[];
  language_certifications: string;
  preferred_salary_min: number;
  preferred_salary_max: number;
  preferred_currency: "KRW" | "JPY";
  preferred_locations: string[];
  preferred_company_types: string[];
  work_style_preference: "remote" | "hybrid" | "onsite" | "any";
  relocation_available: boolean;
  visa_support_needed: boolean;
  self_introduction: string;
  key_project_experience: string;
  motivation: string;
  concerns: string;
  github_url: string;
};

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

function readDraft(): EmployeeProfileDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_DRAFT_KEY);
    if (!raw) return null;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<EmployeeProfileDraft>) };
  } catch {
    return null;
  }
}

function dbProfileToDraft(p: DbEmployeeProfile): EmployeeProfileDraft {
  return {
    fullName: p.full_name ?? "",
    birthDate: p.birth_date ?? "",
    gender: p.gender ?? "male",
    nationality: p.nationality ?? "korean",
    yearsOfExperience: String(p.years_of_experience ?? ""),
    targetRoles: (p.target_roles ?? []).join(", "),
    techStack: (p.tech_stack ?? []).join(", "),
    languageCertifications: p.language_certifications ?? "",
    preferredSalaryMin: String(p.preferred_salary_min ?? ""),
    preferredSalaryMax: String(p.preferred_salary_max ?? ""),
    preferredCurrency: p.preferred_currency ?? "JPY",
    preferredLocations: (p.preferred_locations ?? []).join(", "),
    preferredCompanyTypes: (p.preferred_company_types ?? []).join(", "),
    workStylePreference: p.work_style_preference ?? "hybrid",
    relocationAvailable: p.relocation_available ?? false,
    visaSupportNeeded: p.visa_support_needed ?? false,
    selfIntroduction: p.self_introduction ?? "",
    keyProjectExperience: p.key_project_experience ?? "",
    motivation: p.motivation ?? "",
    concerns: p.concerns ?? "",
    githubUrl: p.github_url ?? "",
  };
}

async function fetchProfileFromDb(): Promise<EmployeeProfileDraft | null> {
  try {
    const res = await fetch("/api/employee/profile", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as { authenticated?: boolean; employeeProfile?: DbEmployeeProfile | null };
    if (!data.authenticated || !data.employeeProfile) return null;
    return dbProfileToDraft(data.employeeProfile);
  } catch {
    return null;
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

function toPositiveNumber(value: string, label: string, invalidNumberMessage: (label: string) => string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(invalidNumberMessage(label));
  }
  return number;
}

function buildPayload(
  draft: EmployeeProfileDraft,
  copy: {
    invalidNumber: (label: string) => string;
    invalidSalaryRange: string;
    salaryMin: string;
    salaryMax: string;
    years: string;
  }
) {
  const preferredSalaryMin = toPositiveNumber(draft.preferredSalaryMin, copy.salaryMin, copy.invalidNumber);
  const preferredSalaryMax = toPositiveNumber(draft.preferredSalaryMax, copy.salaryMax, copy.invalidNumber);

  if (preferredSalaryMax < preferredSalaryMin) {
    throw new Error(copy.invalidSalaryRange);
  }

  return {
    full_name: draft.fullName.trim(),
    birth_date: draft.birthDate,
    gender: draft.gender,
    nationality: draft.nationality,
    years_of_experience: toPositiveNumber(draft.yearsOfExperience, copy.years, copy.invalidNumber),
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

async function putJson(path: string, body: unknown, errorMessage: string): Promise<SaveApiResponse> {
  const response = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) throw new Error(errorMessage);
  return response.json() as Promise<SaveApiResponse>;
}

export default function PortfolioForm({
  title,
  description
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations("portfolio");
  const router = useRouter();
  const [draft, setDraft] = useState<EmployeeProfileDraft>(emptyDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const localDraft = readDraft();
    if (localDraft) {
      setDraft(localDraft);
      return;
    }
    void fetchProfileFromDb().then((dbDraft) => {
      if (dbDraft) setDraft(dbDraft);
    });
  }, []);

  function updateDraft<K extends keyof EmployeeProfileDraft>(field: K, value: EmployeeProfileDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
    setStatusMessage("");
  }

  async function refreshRecommendations() {
    try {
      const recommendations = await fetchEmployeeRecommendations(t("saveFailed"));
      writeCachedEmployeeRecommendations(recommendations);
      setSaveState("saved");
      setStatusMessage(t("recommendDone"));
    } catch {
      setSaveState("saved");
      setStatusMessage(t("recommendLater"));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setStatusMessage(t("saveStart"));
    writeDraft(draft);
    clearCachedEmployeeRecommendations();

    try {
      const payload = buildPayload(draft, {
        invalidNumber: (label) => t("invalidNumber", { label }),
        invalidSalaryRange: t("invalidSalaryRange"),
        salaryMin: t("salaryMin"),
        salaryMax: t("salaryMax"),
        years: t("years")
      });
      const profileResult = await putJson("/api/employee/profile", payload, t("saveFailed"));

      if (!profileResult.authenticated || !profileResult.saved) {
        throw new Error(t("saveNoSession"));
      }

      setSaveState("saved");
      setStatusMessage(t("saveDone"));
      void refreshRecommendations();
      router.replace("/employee/companies");
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : t("saveFailed"));
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <form className="mx-auto max-w-5xl space-y-5" onSubmit={handleSubmit}>
        <header className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-h1 font-black text-ink">{title ?? t("savePortfolio")}</h1>
          <p className="mt-2 text-body leading-6 text-gray-500">{description ?? t("draftHint")}</p>
        </header>

        <section className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
          <Field label={t("name")} value={draft.fullName} onChange={(value) => updateDraft("fullName", value)} required />
          <Field
            label={t("birthDate")}
            type="date"
            value={draft.birthDate}
            onChange={(value) => updateDraft("birthDate", value)}
            required
          />
          <SelectField
            label={t("gender")}
            value={draft.gender}
            onChange={(value) => updateDraft("gender", value as EmployeeProfileDraft["gender"])}
            options={[
              { value: "male", label: t("male") },
              { value: "female", label: t("female") },
            ]}
          />
          <SelectField
            label={t("nationality")}
            value={draft.nationality}
            onChange={(value) => updateDraft("nationality", value as EmployeeProfileDraft["nationality"])}
            options={[
              { value: "korean", label: t("korean") },
              { value: "japanese", label: t("japanese") },
            ]}
          />
          <Field
            label={t("years")}
            type="number"
            value={draft.yearsOfExperience}
            onChange={(value) => updateDraft("yearsOfExperience", value)}
            required
          />
          <Field
            label={t("targetRoles")}
            value={draft.targetRoles}
            onChange={(value) => updateDraft("targetRoles", value)}
            placeholder={t("targetRolesPlaceholder")}
            required
          />
          <Field
            label={t("techStack")}
            value={draft.techStack}
            onChange={(value) => updateDraft("techStack", value)}
            placeholder={t("techStackPlaceholder")}
            required
          />
          <Field
            label={t("languageCertifications")}
            value={draft.languageCertifications}
            onChange={(value) => updateDraft("languageCertifications", value)}
            placeholder={t("languageCertificationsPlaceholder")}
            required
          />
          <Field
            label={t("salaryMin")}
            type="number"
            value={draft.preferredSalaryMin}
            onChange={(value) => updateDraft("preferredSalaryMin", value)}
            required
          />
          <Field
            label={t("salaryMax")}
            type="number"
            value={draft.preferredSalaryMax}
            onChange={(value) => updateDraft("preferredSalaryMax", value)}
            required
          />
          <SelectField
            label={t("currency")}
            value={draft.preferredCurrency}
            onChange={(value) => updateDraft("preferredCurrency", value as EmployeeProfileDraft["preferredCurrency"])}
            options={[
              { value: "JPY", label: "JPY" },
              { value: "KRW", label: "KRW" },
            ]}
          />
          <Field
            label={t("locations")}
            value={draft.preferredLocations}
            onChange={(value) => updateDraft("preferredLocations", value)}
            placeholder={t("locationsPlaceholder")}
            required
          />
          <Field
            label={t("companyTypes")}
            value={draft.preferredCompanyTypes}
            onChange={(value) => updateDraft("preferredCompanyTypes", value)}
            placeholder={t("companyTypesPlaceholder")}
            required
          />
          <SelectField
            label={t("workStyle")}
            value={draft.workStylePreference}
            onChange={(value) => updateDraft("workStylePreference", value as EmployeeProfileDraft["workStylePreference"])}
            options={[
              { value: "remote", label: t("remote") },
              { value: "hybrid", label: t("hybrid") },
              { value: "onsite", label: t("onsite") },
              { value: "any", label: t("any") },
            ]}
          />

          <div className="md:col-span-2 grid gap-3 rounded-xl bg-bridge-paper p-4 sm:grid-cols-2">
            <CheckboxField
              label={t("relocation")}
              checked={draft.relocationAvailable}
              onChange={(checked) => updateDraft("relocationAvailable", checked)}
            />
            <CheckboxField
              label={t("visa")}
              checked={draft.visaSupportNeeded}
              onChange={(checked) => updateDraft("visaSupportNeeded", checked)}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label={t("selfIntroduction")}
              value={draft.selfIntroduction}
              onChange={(value) => updateDraft("selfIntroduction", value)}
              rows={6}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={t("projectExperience")}
              value={draft.keyProjectExperience}
              onChange={(value) => updateDraft("keyProjectExperience", value)}
              rows={6}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={t("motivation")}
              value={draft.motivation}
              onChange={(value) => updateDraft("motivation", value)}
              rows={5}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={t("concerns")}
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
            {saveState === "saving" ? t("saving") : t("savePortfolio")}
          </button>
          {statusMessage ? (
            <span className={["text-body font-bold", saveState === "error" ? "text-bridge-coral" : "text-bridge-teal"].join(" ")}>
              {statusMessage}
            </span>
          ) : (
            <span className="text-body text-gray-400">{t("draftHint")}</span>
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
