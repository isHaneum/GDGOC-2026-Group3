import { getCurrentMarket } from "@shared/market";
import type { BridgeUserRole } from "./roleStorage";

export type AccountMarket = "KR" | "JP";

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
  return role === "developer" ? "/employee/companies" : "/employer/postings";
}

export function marketForSignup(): AccountMarket {
  return getCurrentMarket().id === "jp-kr" ? "JP" : "KR";
}

export function resolveAccountRole(account: CurrentAccount): BridgeUserRole | null {
  const profileRole = account.profile?.role;
  if (profileRole === "developer" || profileRole === "employer") return profileRole;

  const metadataRole = account.user.user_metadata?.role;
  if (metadataRole === "developer" || metadataRole === "employer") return metadataRole;

  return null;
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

