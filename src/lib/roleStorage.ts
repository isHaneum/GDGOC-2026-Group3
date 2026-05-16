export type BridgeUserRole = "developer" | "employer";

export const BRIDGE_USER_ROLE_KEY = "bridge_user_role";

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
  return value === "developer" || value === "employer";
}

export function readBridgeUserRole(): BridgeUserRole | null {
  if (typeof window === "undefined") return null;

  try {
    const storedRole = window.localStorage.getItem(BRIDGE_USER_ROLE_KEY);
    return isBridgeUserRole(storedRole) ? storedRole : null;
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

export function getRequiredBridgeRouteRole(pathname: string, roleParam?: string | null): BridgeUserRole | null {
  if (pathname.startsWith("/employee") || pathname === "/signup/portfolio") return "developer";
  if (pathname.startsWith("/employer")) return "employer";
  return null;
}

export function isPublicBridgeRoute(pathname: string) {
  return publicBridgeRoutes.has(pathname) || pathname.startsWith("/community/posts/");
}

export function bridgeRoleLabel(role: BridgeUserRole) {
  return role === "developer" ? "Applicant" : "Employer";
}
