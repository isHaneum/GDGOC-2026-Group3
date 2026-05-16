'use client';

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  apiErrorMessage,
  destinationForRole,
  marketForSignup
} from "@src/lib/authClient";
import { type BridgeUserRole, readBridgeUserRole, writeBridgeUserRole } from "@src/lib/roleStorage";

const SIGNUP_PROFILE_DRAFT_KEY = "bridge_signup_profile_draft";

type SignupProfileDraft = {
  loginId: string;
  nickname: string;
  profileImageUrl: string;
  email: string;
  phone: string;
};

const emptyDraft: SignupProfileDraft = {
  loginId: "",
  nickname: "",
  profileImageUrl: "",
  email: "",
  phone: ""
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
      setErrorMessage("먼저 지원자 또는 채용자 역할을 선택해주세요.");
      return;
    }

    setStatus("submitting");
    writeDraft(draft);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: draft.email,
        password,
        role,
        market: marketForSignup()
      })
    });

    if (!response.ok) {
      setErrorMessage(await apiErrorMessage(response, "회원가입에 실패했습니다."));
      setStatus("ready");
      return;
    }

    writeBridgeUserRole(role);
    router.replace(role === "developer" ? "/signup/portfolio" : destinationForRole(role));
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-xl border border-gray-100 bg-white p-5 shadow-panel">
        <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">
          Signup Profile
        </p>
        <h1 className="mt-3 text-2xl font-bold text-ink">프로필 작성</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          로그인 계정과 기본 연락처 정보를 입력합니다. 역할은 온보딩에서 선택한 값으로 저장됩니다.
        </p>

        {!role ? (
          <div className="mt-5 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
            <p className="text-sm font-bold text-bridge-coral">역할 선택이 필요합니다.</p>
            <Link href="/signup/onboarding" className="mt-3 inline-flex text-sm font-black text-ink underline">
              온보딩으로 이동
            </Link>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="ID" value={draft.loginId} onChange={(value) => updateDraft("loginId", value)} />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <Field label="Nickname" value={draft.nickname} onChange={(value) => updateDraft("nickname", value)} />
          <Field
            label="Profile image URL"
            value={draft.profileImageUrl}
            onChange={(value) => updateDraft("profileImageUrl", value)}
          />
          <Field
            label="Email"
            type="email"
            value={draft.email}
            onChange={(value) => updateDraft("email", value)}
            required
          />
          <Field label="Phone" value={draft.phone} onChange={(value) => updateDraft("phone", value)} />

          {errorMessage ? (
            <p className="md:col-span-2 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-3 text-sm font-bold text-bridge-coral">
              {errorMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-xl bg-bridge-primary px-5 py-3 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? "Creating account..." : "Continue"}
            </button>
            <span className="text-sm text-gray-400">
              Current role: {role === "developer" ? "Applicant" : role === "employer" ? "Employer" : "Not selected"}
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
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}

