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
        email: draft.email.trim(),
        password,
        nickname: draft.nickname.trim(),
        role,
        market: marketForSignup(),
        companyId: role === "employer" ? draft.companyId.trim() || undefined : undefined,
      })
    });

    if (!response.ok) {
      setErrorMessage(await apiErrorMessage(response, "회원가입에 실패했습니다."));
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
          회원가입 프로필
        </p>
        <h1 className="mt-3 text-h1 font-bold text-ink">계정 정보 입력</h1>
        <p className="mt-2 text-body leading-6 text-gray-500">
          가입에 필요한 이메일, 비밀번호, 닉네임을 입력합니다. 채용자는 회사 식별자도 함께 저장할 수 있습니다.
        </p>

        {!role ? (
          <div className="mt-5 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
            <p className="text-body font-bold text-bridge-coral">역할 선택이 필요합니다.</p>
            <Link href="/signup/onboarding" className="mt-3 inline-flex text-body font-black text-ink underline">
              온보딩으로 이동
            </Link>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="닉네임"
            value={draft.nickname}
            onChange={(value) => updateDraft("nickname", value)}
            required
          />
          <Field
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <Field
            label="이메일"
            type="email"
            value={draft.email}
            onChange={(value) => updateDraft("email", value)}
            required
          />
          {role === "employer" ? (
            <Field
              label="회사 ID"
              value={draft.companyId}
              onChange={(value) => updateDraft("companyId", value)}
              placeholder="예: mercari"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-bridge-paper px-4 py-3 text-body text-gray-500">
              지원자는 다음 단계에서 포트폴리오 스키마를 모두 입력합니다.
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
              {status === "submitting" ? "계정 생성 중..." : "계속하기"}
            </button>
            <span className="text-body text-gray-400">
              현재 역할: {role === "employee" ? "지원자" : role === "employer" ? "채용자" : "선택 안 됨"}
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
