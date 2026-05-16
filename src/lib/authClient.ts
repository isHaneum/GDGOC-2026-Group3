import { getCurrentMarket, getDbMarketId } from "@shared/market";
import { normalizeBridgeUserRole, type BridgeUserRole } from "./roleStorage";

export type AccountMarket = "KR_TO_JP" | "JP_TO_KR";

export type AccountProfile = {
  role?: BridgeUserRole;
  market?: AccountMarket;
};

export type AccountUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type CurrentAccount = {
  user: AccountUser;
  profile: AccountProfile | null;
};

export function destinationForRole(role: BridgeUserRole) {
  return role === "employee" ? "/employee/companies" : "/employer/postings";
}

export function marketForSignup(): AccountMarket {
  return getDbMarketId(getCurrentMarket());
}

export function resolveAccountRole(account: CurrentAccount): BridgeUserRole | null {
  return normalizeBridgeUserRole(account.profile?.role) ?? normalizeBridgeUserRole(account.user.user_metadata?.role);
}

export async function fetchCurrentAccount(): Promise<CurrentAccount | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json()) as CurrentAccount;
  if (!payload?.user) return null;

  return payload;
}

export async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error || payload.message || fallback;
  } catch {
    return fallback;
  }
}
