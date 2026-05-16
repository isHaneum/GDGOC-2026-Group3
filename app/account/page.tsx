'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchCurrentAccount,
  resolveAccountRole
} from "@src/lib/authClient";
import { clearBridgeUserRole, writeBridgeUserRole } from "@src/lib/roleStorage";

const ACCOUNT_DRAFT_KEY = "bridge_account_profile_draft";

type AccountDraft = {
  nickname: string;
  profileImageUrl: string;
  phone: string;
};

const emptyDraft: AccountDraft = {
  nickname: "",
  profileImageUrl: "",
  phone: ""
};

function readDraft(): AccountDraft {
  if (typeof window === "undefined") return emptyDraft;

  try {
    const raw = window.localStorage.getItem(ACCOUNT_DRAFT_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<AccountDraft>) };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: AccountDraft) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ACCOUNT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [market, setMarket] = useState("");
  const [draft, setDraft] = useState<AccountDraft>(emptyDraft);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const account = await fetchCurrentAccount();
      if (cancelled) return;

      if (!account) {
        router.replace("/signin");
        return;
      }

      const role = resolveAccountRole(account);
      if (role) writeBridgeUserRole(role);

      setEmail(account.user.email ?? "");
      setRoleLabel(role === "developer" ? "Applicant" : role === "employer" ? "Employer" : "Unknown");
      setMarket(account.profile?.market ?? String(account.user.user_metadata?.market ?? "Unknown"));
      setDraft(readDraft());
      setLoading(false);
    }

    void loadAccount();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    clearBridgeUserRole();
    router.replace("/signin");
  }

  if (loading) {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper" />;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-xl border border-gray-100 bg-white p-5 shadow-panel">
        <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">계정</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">계정 정보</h1>

        <dl className="mt-5 grid gap-3 rounded-xl bg-bridge-paper p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">이메일</dt>
            <dd className="mt-1 font-bold text-ink break-words">{email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">역할</dt>
            <dd className="mt-1 font-bold text-ink">{roleLabel}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">시장</dt>
            <dd className="mt-1 font-bold text-ink">{market}</dd>
          </div>
        </dl>

        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            writeDraft(draft);
            setSaved(true);
          }}
        >
          <Field
            label="닉네임"
            value={draft.nickname}
            onChange={(value) => {
              setDraft((current) => ({ ...current, nickname: value }));
              setSaved(false);
            }}
          />
          <Field
            label="프로필 이미지 URL"
            value={draft.profileImageUrl}
            onChange={(value) => {
              setDraft((current) => ({ ...current, profileImageUrl: value }));
              setSaved(false);
            }}
          />
          <Field
            label="연락처"
            value={draft.phone}
            onChange={(value) => {
              setDraft((current) => ({ ...current, phone: value }));
              setSaved(false);
            }}
          />

          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="rounded-xl bg-bridge-primary px-5 py-3 text-sm font-bold text-ink transition-opacity hover:opacity-90"
            >
              프로필 저장
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-500 transition-colors hover:border-bridge-coral hover:text-bridge-coral"
            >
              로그아웃
            </button>
            {saved ? <span className="text-sm font-bold text-bridge-teal">로컬에 저장됨</span> : null}
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
      />
    </label>
  );
}

