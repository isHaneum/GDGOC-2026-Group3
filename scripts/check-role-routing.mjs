import { readFileSync } from "node:fs";
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

function assertNotContains(relativePath, forbidden, context) {
  const content = read(relativePath);
  for (const needle of forbidden) {
    if (content.includes(needle)) {
      fail(`${relativePath}: found "${needle}" (${context})`);
    }
  }
}

assertNotContains(
  "app/layout.tsx",
  ["Developer", "Applicants", "Hiring Companies", "Signal Lab", "Apply"],
  "global layout must not hardcode mixed navigation labels"
);

assertNotContains(
  "app/developer/page.tsx",
  ["지원자 관리", "Recommended Applicants", "Applicants Management"],
  "developer page must not expose employer applicant management"
);

assertNotContains(
  "app/employer/page.tsx",
  ["자기소개서 작성", "Resume edit", "Best-fit companies as the main feature"],
  "employer page must not expose developer resume/company recommendation as its primary feature"
);

const signalLab = read("app/signal-lab/page.tsx");
if (
  !signalLab.includes("role=developer") &&
  !signalLab.includes("searchParams") &&
  !signalLab.includes("URLSearchParams")
) {
  fail("app/signal-lab/page.tsx: Signal Lab must support role param or role detection");
}

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
