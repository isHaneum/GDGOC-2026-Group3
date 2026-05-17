'use client';

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@i18n/navigation";
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
  const auth = useTranslations("auth");
  const common = useTranslations("common");
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
      setErrorMessage(await apiErrorMessage(response, auth("signinFailed")));
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
            <p className="text-h2 font-bold uppercase tracking-[0.42em] text-bridge-teal">
              {auth("signupEyebrow")}
            </p>
            <h1 className="mt-3 max-w-2xl text-display2 font-light leading-tight tracking-tight text-ink sm:text-display1">
              {auth("signupMapTitle")}
            </h1>
          </div>
          <p className="max-w-sm text-body font-medium leading-6 text-gray-500">
            {auth("signupMapHint")}
          </p>
        </div>

        <div className="absolute inset-x-0 top-8 z-10 flex flex-col items-center px-2 sm:top-10 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[85%] lg:justify-center lg:px-4">
          <BridgeDirectionMap
            hovered={hoveredDirection}
            onHover={setHoveredDirection}
            onSelect={handleDirectionSelect}
          />
        </div>
      </section>

      <section className="pointer-events-none relative z-30 mx-auto flex min-h-[calc(100vh-128px)] max-w-7xl items-end justify-center pt-[430px] sm:pt-[520px] lg:items-center lg:justify-end lg:pt-0 pr-10">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto w-full max-w-[420px] rounded-xl border border-gray-100 bg-white/95 p-5 shadow-panel backdrop-blur"
        >
          <h2 className="text-h1 font-bold text-ink">{auth("signinTitle")}</h2>
          <p className="mt-2 text-body leading-6 text-gray-500">
            {auth("signinDescription")}
          </p>

          <label className="mt-6 block">
            <span className="text-caption font-black uppercase tracking-widest text-gray-400">{common("email")}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-body text-ink outline-none focus:border-bridge-teal"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-caption font-black uppercase tracking-widest text-gray-400">{common("password")}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-bridge-paper px-4 py-3 text-body text-ink outline-none focus:border-bridge-teal"
            />
          </label>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-3 text-body font-bold text-bridge-coral">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-6 w-full rounded-xl bg-bridge-primary px-5 py-3 text-body font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "submitting" ? auth("signinSubmitting") : auth("signinTitle")}
          </button>

          <p className="mt-5 text-center text-body text-gray-500">
            {auth("noAccount")}{" "}
            <Link href="/signup/onboarding" className="font-black text-bridge-teal hover:underline">
              {auth("signupLink")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
