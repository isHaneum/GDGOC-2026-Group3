export type BridgeUserRole = "employee" | "employer";

export const BRIDGE_USER_ROLE_KEY = "bridge_user_role";
const bridgeLocales = new Set(["ko", "ja"]);

const publicBridgeRoutes = new Set([
  "/",
  "/signin",
  "/signup",
  "/signup/onboarding",
  "/signup/profile",
  "/community",
  "/community/posts",
  "/not-found"
]);

export function isBridgeUserRole(value: unknown): value is BridgeUserRole {
  return value === "employee" || value === "employer";
}

export function normalizeBridgeUserRole(value: unknown): BridgeUserRole | null {
  if (value === "employee" || value === "developer") return "employee";
  if (value === "employer") return "employer";
  return null;
}

export function readBridgeUserRole(): BridgeUserRole | null {
  if (typeof window === "undefined") return null;

  try {
    const storedRole = window.localStorage.getItem(BRIDGE_USER_ROLE_KEY);
    return normalizeBridgeUserRole(storedRole);
  } catch {
    return null;
  }
}

export function writeBridgeUserRole(role: BridgeUserRole) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRIDGE_USER_ROLE_KEY, role);
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export function clearBridgeUserRole() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BRIDGE_USER_ROLE_KEY);
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export function stripBridgeLocale(pathname: string): string {
  const parts = pathname.split("/");
  const maybeLocale = parts[1];
  if (!bridgeLocales.has(maybeLocale)) return pathname || "/";

  const stripped = `/${parts.slice(2).join("/")}`;
  return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/";
}

export function getRequiredBridgeRouteRole(pathname: string, roleParam?: string | null): BridgeUserRole | null {
  const normalizedPathname = stripBridgeLocale(pathname);
  if (normalizedPathname.startsWith("/employee") || normalizedPathname === "/signup/portfolio") return "employee";
  if (normalizedPathname.startsWith("/employer")) return "employer";
  return null;
}

export function isPublicBridgeRoute(pathname: string) {
  const normalizedPathname = stripBridgeLocale(pathname);
  return publicBridgeRoutes.has(normalizedPathname) || normalizedPathname.startsWith("/community/posts/");
}

export function bridgeRoleLabel(role: BridgeUserRole) {
  return role === "employee" ? "Applicant" : "Employer";
}
