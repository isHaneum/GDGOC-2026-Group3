import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  failures.push(message);
}

function assertExists(relativePath, context) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: missing (${context})`);
  }
}

function assertNotExists(relativePath, context) {
  if (existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: should not exist (${context})`);
  }
}

function assertNotContains(relativePath, forbidden, context) {
  const content = read(relativePath);
  for (const needle of forbidden) {
    if (content.includes(needle)) {
      fail(`${relativePath}: found "${needle}" (${context})`);
    }
  }
}

function assertContains(relativePath, required, context) {
  const content = read(relativePath);
  for (const needle of required) {
    if (!content.includes(needle)) {
      fail(`${relativePath}: missing "${needle}" (${context})`);
    }
  }
}

assertExists("app/[locale]/layout.tsx", "locale-prefixed routes must own the user-facing shell");
assertExists("app/[locale]/signin/page.tsx", "signin must be locale-prefixed");
assertExists("app/[locale]/employee/companies/page.tsx", "employee routes must be locale-prefixed");
assertExists("app/[locale]/employer/postings/page.tsx", "employer routes must be locale-prefixed");
assertNotExists("app/signin/page.tsx", "unprefixed signin is redirected by proxy");
assertNotExists("app/employee/page.tsx", "unprefixed employee routes are redirected by proxy");
assertNotExists("app/employer/page.tsx", "unprefixed employer routes are redirected by proxy");

assertNotContains(
  "app/[locale]/layout.tsx",
  ["Developer", "Applicants", "Hiring Companies", "Signal Lab", "Apply"],
  "global layout must not hardcode mixed navigation labels"
);

assertNotContains(
  "src/components/RoleAwareNav.tsx",
  ['href: "/developer"', 'href: "/apply"', 'href: "/companies"', 'href: "/get-started"', 'href: "/forums"', 'href: "/signal-lab"'],
  "primary navigation must use the normalized route tree"
);

assertNotContains(
  "src/lib/roleStorage.ts",
  ["/developer", "/apply", "/companies", "/get-started", "/forums"],
  "route gate must use employee/employer/community/signup paths"
);

assertContains(
  "proxy.ts",
  ["defaultLocale", "localizePathname", "stripLocaleFromPathname"],
  "unprefixed routes must redirect to default locale"
);

assertContains(
  "src/lib/roleStorage.ts",
  ["stripBridgeLocale", 'normalizedPathname.startsWith("/employee")', 'normalizedPathname.startsWith("/employer")', 'normalizedPathname === "/signup/portfolio"'],
  "route gate must protect employee, employer, and applicant portfolio signup paths"
);

assertContains(
  "src/components/RoleAwareNav.tsx",
  ["/employee/companies", "/employee/portfolio", "/employer/postings", "/employer/applicants", "/community/posts", 'locale={nextLocale}'],
  "role navigation must expose normalized route tree and language switching"
);

const proxy = read("proxy.ts");
if (
  proxy.includes("NEXT_PUBLIC_SUPABASE_URL!") ||
  proxy.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY!")
) {
  fail("proxy.ts: Supabase env vars must be guarded before creating the client");
}

if (failures.length) {
  console.error("Role routing guardrail check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Role routing guardrail check passed.");
