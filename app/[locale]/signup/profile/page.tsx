'use client';

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@i18n/navigation";
import {
  apiErrorMessage,
  destinationForRole,
  marketForSignup
} from "@src/lib/authClient";
import { type BridgeUserRole, readBridgeUserRole, writeBridgeUserRole } from "@src/lib/roleStorage";

const SIGNUP_PROFILE_DRAFT_KEY = "bridge_signup_profile_draft";

type SignupProfileDraft = {
  nickname: string;
  email: string;
  companyId: string;
};

const emptyDraft: SignupProfileDraft = {
  nickname: "",
  email: "",
  companyId: ""
};

function readDraft(): SignupProfileDraft {
  if (typeof window === "undefined") return emptyDraft;

  try {
    const raw = window.localStorage.getItem(SIGNUP_PROFILE_DRAFT_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<SignupProfileDraft>) };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: SignupProfileDraft) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SIGNUP_PROFILE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export default function SignupProfilePage() {
  const t = useTranslations("signup");
  const common = useTranslations("common");
  const router = useRouter();
  const [role, setRole] = useState<BridgeUserRole | null>(null);
  const [draft, setDraft] = useState<SignupProfileDraft>(emptyDraft);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"ready" | "submitting">("ready");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setRole(readBridgeUserRole());
    setDraft(readDraft());
  }, []);

  function updateDraft(field: keyof SignupProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!role) {
      setErrorMessage(t("roleRequiredError"));
      return;
    }

    setStatus("submitting");
    writeDraft(draft);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: draft.email.trim(),
        password,
        nickname: draft.nickname.trim(),
        role,
        market: marketForSignup(),
        companyId: role === "employer" ? draft.companyId.trim() || undefined : undefined,
      })
    });

    if (!response.ok) {
      setErrorMessage(await apiErrorMessage(response, t("signupFailed")));
      setStatus("ready");
      return;
    }

    writeBridgeUserRole(role);
    router.replace(role === "employee" ? "/signup/portfolio" : destinationForRole(role));
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-xl border border-gray-100 bg-white p-5 shadow-panel">
        <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
          {t("profileEyebrow")}
        </p>
        <h1 className="mt-3 text-h1 font-bold text-ink">{t("profileTitle")}</h1>
        <p className="mt-2 text-body leading-6 text-gray-500">
          {t("profileDescription")}
        </p>

        {!role ? (
          <div className="mt-5 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
            <p className="text-body font-bold text-bridge-coral">{t("roleRequired")}</p>
            <Link href="/signup/onboarding" className="mt-3 inline-flex text-body font-black text-ink underline">
              {t("goOnboarding")}
            </Link>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label={t("nickname")}
            value={draft.nickname}
            onChange={(value) => updateDraft("nickname", value)}
            required
          />
          <Field
            label={common("password")}
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <Field
            label={common("email")}
            type="email"
            value={draft.email}
            onChange={(value) => updateDraft("email", value)}
            required
          />
          {role === "employer" ? (
            <Field
              label={t("companyId")}
              value={draft.companyId}
              onChange={(value) => updateDraft("companyId", value)}
              placeholder={t("companyIdPlaceholder")}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-bridge-paper px-4 py-3 text-body text-gray-500">
              {t("employeeNextStep")}
            </div>
          )}

          {errorMessage ? (
            <p className="md:col-span-2 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-3 text-body font-bold text-bridge-coral">
              {errorMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-xl bg-bridge-primary px-5 py-3 text-body font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? t("creatingAccount") : common("continue")}
            </button>
            <span className="text-body text-gray-400">
              {t("currentRole")}: {role === "employee" ? common("applicant") : role === "employer" ? common("employer") : t("noRole")}
            </span>
          </div>
        </form>
      </section>
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
