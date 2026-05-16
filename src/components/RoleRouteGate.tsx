'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  type BridgeUserRole,
  bridgeRoleLabel,
  getRequiredBridgeRouteRole,
  readBridgeUserRole,
  writeBridgeUserRole
} from "@src/lib/roleStorage";

export default function RoleRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [mounted, setMounted] = useState(false);
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);

  const requiredRole = useMemo(
    () => getRequiredBridgeRouteRole(pathname, roleParam),
    [pathname, roleParam]
  );

  useEffect(() => {
    setStoredRole(readBridgeUserRole());
    setMounted(true);
  }, [pathname, roleParam]);

  if (!requiredRole) return children;

  if (!mounted) {
    return <div className="min-h-[45vh] bg-bridge-paper" />;
  }

  if (storedRole === requiredRole) return children;

  const gatedRole = requiredRole;

  function switchRole() {
    writeBridgeUserRole(gatedRole);
    setStoredRole(gatedRole);
  }

  const requiredRoleLabel = bridgeRoleLabel(gatedRole);
  const currentRoleLabel = storedRole ? bridgeRoleLabel(storedRole) : "No role";

  return (
    <section className="min-h-[70vh] bg-bridge-paper px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
        <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">
          Route Access
        </p>
        <h1 className="mt-3 text-2xl font-black text-ink">
          {requiredRoleLabel} area
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          This page is scoped to the {requiredRoleLabel.toLowerCase()} flow. Current role:{" "}
          <span className="font-bold text-ink">{currentRoleLabel}</span>.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={switchRole}
            className="rounded-full bg-bridge-primary px-5 py-3 text-sm font-black text-ink transition-opacity hover:opacity-90"
          >
            Continue as {requiredRoleLabel}
          </button>
          <Link
            href="/signup/onboarding"
            className="rounded-full border border-gray-200 px-5 py-3 text-center text-sm font-black text-gray-500 transition-colors hover:border-bridge-primary hover:text-ink"
          >
            Choose role
          </Link>
        </div>
      </div>
    </section>
  );
}
