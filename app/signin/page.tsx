'use client';

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setMarket } from "@shared/market";
import { BridgeDirectionMap } from "@src/components/home/BridgeDirectionMap";
import { bridgeDirections, type BridgeDirectionId } from "@src/components/home/landingData";
import {
  apiErrorMessage,
  destinationForRole,
  fetchCurrentAccount,
  resolveAccountRole
} from "@src/lib/authClient";
import { readBridgeUserRole, writeBridgeUserRole } from "@src/lib/roleStorage";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "submitting">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredDirection, setHoveredDirection] = useState<BridgeDirectionId | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function redirectIfSignedIn() {
      const account = await fetchCurrentAccount();
      if (cancelled) return;

      if (account) {
        const role = resolveAccountRole(account) ?? readBridgeUserRole();
        if (role) {
          writeBridgeUserRole(role);
          router.replace(destinationForRole(role));
          return;
        }
      }

      setStatus("ready");
    }

    void redirectIfSignedIn();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatus("submitting");

    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setErrorMessage(await apiErrorMessage(response, "로그인에 실패했습니다."));
      setStatus("ready");
      return;
    }

    const account = await fetchCurrentAccount();
    const role = account ? resolveAccountRole(account) ?? readBridgeUserRole() : readBridgeUserRole();

    if (!role) {
      router.replace("/signup/onboarding");
      return;
    }

    writeBridgeUserRole(role);
    router.replace(destinationForRole(role));
  }

  function handleDirectionSelect(direction: BridgeDirectionId) {
    setMarket(direction);
    router.push("/signup/onboarding");
  }

  if (status === "checking") {
    return <main className="min-h-[calc(100vh-64px)] bg-bridge-paper" />;
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden bg-white px-4 py-8">
      <div className="absolute inset-0 z-0 bg-white" aria-hidden="true" />

      <section className="absolute inset-0 z-10">
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
          <div>
            <p className="text-[10px] font-light uppercase tracking-[0.42em] text-bridge-teal/70">
              New account
            </p>
            <h1 className="mt-3 max-w-3xl text-6xl font-thin leading-none tracking-normal text-ink/10 sm:text-7xl lg:text-8xl">
              Sign Up starts with direction
            </h1>
          </div>
          <p className="max-w-sm text-sm font-light leading-6 text-gray-400">
            지도를 눌러 지원 방향을 먼저 고르면, 다음 단계에서 지원자 또는 채용자 역할을 선택합니다.
          </p>
        </div>

        <div className="absolute inset-x-0 top-8 z-10 flex flex-col items-center px-2 sm:top-10 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[72%] lg:justify-center lg:px-8">
          <BridgeDirectionMap
            hovered={hoveredDirection}
            onHover={setHoveredDirection}
            onSelect={handleDirectionSelect}
          />
          <div className="relative z-20 -mt-3 text-center sm:-mt-6">
            <p className="text-xs font-light text-gray-400">
              {hoveredDirection
                ? `${bridgeDirections[hoveredDirection].shortLabel} · Click to continue signup`
                : "Choose Korea to Japan or Japan to Korea"}
            </p>
            <Link
              href="/signup/onboarding"
              className="mt-3 inline-flex rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-xs font-bold text-ink backdrop-blur transition-colors hover:border-bridge-primary"
            >
              Sign up without map
            </Link>
          </div>
        </div>
      </section>

      <section className="pointer-events-none relative z-30 mx-auto flex min-h-[calc(100vh-128px)] max-w-7xl items-end justify-center pt-[430px] sm:pt-[520px] lg:items-center lg:justify-end lg:pt-0">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur"
        >
          <h2 className="text-2xl font-black text-ink">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            계정 역할에 따라 지원자 또는 채용자 페이지로 이동합니다.
          </p>

          <label className="mt-6 block">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-sm text-ink outline-none focus:border-bridge-teal"
            />
          </label>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-3 text-sm font-bold text-bridge-coral">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-6 w-full rounded-full bg-bridge-primary px-5 py-3 text-sm font-black text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "submitting" ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            계정이 없나요?{" "}
            <Link href="/signup/onboarding" className="font-black text-bridge-teal hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
