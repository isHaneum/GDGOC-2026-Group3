'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@i18n/navigation";
import { getCurrentMarket } from "@shared/market";
import {
  type BridgeUserRole,
  readBridgeUserRole,
  writeBridgeUserRole
} from "@src/lib/roleStorage";

function roleDestination(role: BridgeUserRole) {
  return role === "employee" ? "/signup/profile" : "/signup/profile";
}

export default function RoleEntry() {
  const t = useTranslations("signup");
  const router = useRouter();
  const [market, setMarket] = useState(getCurrentMarket());
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setStoredRole(readBridgeUserRole());
    setMounted(true);
  }, []);

  function selectRole(role: BridgeUserRole) {
    writeBridgeUserRole(role);
    router.push(roleDestination(role));
  }

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex rounded-full bg-bridge-primary/10 px-4 py-1 text-caption font-black uppercase tracking-widest text-bridge-teal">
            {market.sourceCountry} to {market.targetCountry}
          </div>
          <h1 className="text-display1 font-black tracking-tight text-ink">{t("startTitle")}</h1>
          <p className="mt-3 max-w-2xl text-body leading-6 text-gray-500">
            {t("startDescription")}
          </p>
          {storedRole ? (
            <button
              type="button"
              onClick={() => router.push(roleDestination(storedRole))}
              className="mt-5 rounded-full border border-bridge-primary bg-white px-4 py-2 text-body font-bold text-bridge-teal hover:bg-bridge-primary/10"
            >
              {t("continueSavedRole")}
            </button>
          ) : null}
        </header>

        <div className="grid w-full gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRole("employee")}
            className="group rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-bridge-primary"
          >
            <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">Applicant</p>
            <h2 className="mt-3 text-display2 font-black text-ink">{t("employeeCardTitle")}</h2>
            <p className="mt-3 text-body leading-6 text-gray-500">
              {t("employeeCardDescription")}
            </p>
            <span className="mt-6 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-body font-bold text-white">
              {t("employeeCta")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            className="group rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-bridge-coral"
          >
            <p className="text-caption font-black uppercase tracking-widest text-bridge-coral">Hiring Company</p>
            <h2 className="mt-3 text-display2 font-black text-ink">{t("employerCardTitle")}</h2>
            <p className="mt-3 text-body leading-6 text-gray-500">
              {t("employerCardDescription")}
            </p>
            <span className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-body font-bold text-white">
              {t("employerCta")}
            </span>
          </button>
        </div>

        <Link href="/signin" className="mt-8 text-body font-bold text-gray-400 hover:text-bridge-primary">
          {t("backSignin")}
        </Link>
      </div>
    </div>
  );
}
