"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileJson,
  Languages,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  loadCompanyJobProfiles,
  loadCompanyRubrics,
  loadCompanySignals,
  loadFitEngineMetadata,
  loadSampleDeveloperProfiles
} from "../lib/companyCriteria";
import {
  rankCompaniesForDeveloper,
  rankDevelopersForCompany,
  validateCompanyJobProfiles
} from "../lib/twoSidedFitEngine";
import type {
  CompanyEvaluationRubric,
  CompanyHiringSignal,
  CompanyJobProfile,
  CompanyJobProfilesValidationSummary,
  CompanyToDeveloperFitResult,
  CompanyToDeveloperScoreBreakdown,
  DeveloperPreference,
  DeveloperToCompanyFitResult,
  DeveloperToCompanyScoreBreakdown,
  FitEngineMetadata
} from "../../shared/companyCriteriaTypes";

type DashboardData = {
  companyJobProfiles: CompanyJobProfile[];
  companyRubrics: CompanyEvaluationRubric[];
  companySignals: CompanyHiringSignal[];
  developerProfiles: DeveloperPreference[];
  metadata: FitEngineMetadata | null;
  validationSummary: CompanyJobProfilesValidationSummary;
};

type LoadState = "loading" | "ready" | "error";
type TabKey = "developerToCompany" | "companyToDeveloper";
type LanguageKey = "한국어" | "日本語" | "EN";
type ChipTone = "green" | "amber" | "rose" | "blue" | "slate";

const developerScoreRows: Array<[keyof DeveloperToCompanyScoreBreakdown, string]> = [
  ["skillFit", "Skill fit"],
  ["roleFit", "Role fit"],
  ["salaryFit", "Salary fit"],
  ["locationFit", "Location fit"],
  ["languageFit", "Language fit"],
  ["experienceFit", "Experience fit"],
  ["workStyleFit", "Work style fit"],
  ["rubricFit", "Rubric fit"]
];

const companyScoreRows: Array<[keyof CompanyToDeveloperScoreBreakdown, string]> = [
  ["requiredSkillMatch", "Required skill match"],
  ["preferredSkillMatch", "Preferred skill match"],
  ["languageRequirementMatch", "Language requirement match"],
  ["experienceLevelMatch", "Experience level match"],
  ["locationWorkstyleMatch", "Location and workstyle match"],
  ["motivationMatch", "Motivation match"],
  ["evidenceConfidence", "Evidence confidence"]
];

const warningExamples = [
  "missing salary",
  "missing language requirement",
  "fallback source",
  "low source confidence",
  "missing experience range",
  "no matching rubricId"
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function humanize(value: string | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(values: string[] | undefined, emptyLabel = "Unknown") {
  if (!values?.length) return emptyLabel;
  return values.join(", ");
}

function formatSalary(
  min: number | undefined,
  max: number | undefined,
  currency: DeveloperPreference["preferredCurrency"] | CompanyJobProfile["salaryCurrency"]
) {
  if (currency === "unknown" || typeof min !== "number" || typeof max !== "number") {
    return "Unknown";
  }

  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${currency} ${formatter.format(min)} - ${formatter.format(max)}`;
}

function formatExperience(profile: CompanyJobProfile) {
  const { minYears, maxYears } = profile.experienceRange;
  if (typeof minYears !== "number" && typeof maxYears !== "number") return "Unknown";
  if (typeof minYears === "number" && typeof maxYears === "number") return `${minYears} - ${maxYears} years`;
  if (typeof minYears === "number") return `${minYears}+ years`;
  return `Up to ${maxYears} years`;
}

function formatLanguages(languages: CompanyJobProfile["requiredLanguages"] | undefined) {
  if (!languages?.length) return "Unknown";
  return languages.map((item) => `${item.language} ${item.level}`).join(", ");
}

function formatDeveloperLanguages(developer: DeveloperPreference) {
  if (!developer.languageCertifications.length) return "Unknown";
  return developer.languageCertifications
    .map((item) => `${item.language} ${item.level}${item.certification ? ` (${item.certification})` : ""}`)
    .join(", ");
}

function getCommonWarnings(summary: CompanyJobProfilesValidationSummary) {
  const counts = new Map<string, number>();
  for (const item of summary.warningsByCompany) {
    for (const warning of item.warnings) {
      counts.set(warning, (counts.get(warning) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}

function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames("rounded-lg border border-slate-200 bg-white shadow-panel", className)}>
      {children}
    </section>
  );
}

function Badge({
  children,
  tone = "slate",
  icon: Icon
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  icon?: LucideIcon;
}) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return (
    <span className={classNames("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

function ChipList({
  title,
  values,
  tone,
  emptyLabel
}: {
  title: string;
  values: string[];
  tone: ChipTone;
  emptyLabel: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? (
          values.map((value, index) => (
            <Badge key={`${title}-${value}-${index}`} tone={tone}>
              {value}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green"
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  helper: string;
  tone?: "green" | "amber" | "blue" | "slate";
}) {
  const iconTones = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={classNames("flex h-10 w-10 items-center justify-center rounded-lg", iconTones[tone])}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const score = clampScore(value);
  const tone = score >= 75 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{label}</span>
        <span className="shrink-0 text-sm font-bold text-slate-950">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <div className={classNames("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  wide
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={classNames("min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3", wide && "sm:col-span-2")}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{value}</div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}

function LoadingPanel() {
  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="flex w-full max-w-md items-center gap-4 p-6">
          <Loader2 className="animate-spin text-green-600" size={24} />
          <div>
            <p className="font-bold text-slate-950">Loading Two-sided Fit Engine</p>
            <p className="mt-1 text-sm text-slate-500">Company criteria data is loading from local JSON files.</p>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="w-full max-w-2xl p-6">
          <Badge tone="rose" icon={AlertTriangle}>Data unavailable</Badge>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Company criteria data could not be loaded.</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </Card>
      </div>
    </main>
  );
}

function MissionCard({ mission }: { mission: DeveloperToCompanyFitResult["recommendedMissions"][number] }) {
  return (
    <article className="rounded-lg border border-green-100 bg-green-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-slate-950">{mission.title}</p>
        <Badge tone="green">{mission.category}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm text-slate-600">
        <div>
          <dt className="font-semibold text-slate-800">Reason</dt>
          <dd className="mt-0.5">{mission.reason}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Expected outcome</dt>
          <dd className="mt-0.5">{mission.expectedOutcome}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Proof created</dt>
          <dd className="mt-0.5">{mission.proofCreated}</dd>
        </div>
      </dl>
    </article>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
        <FileJson size={16} />
        {title}
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-5 text-slate-200 thin-scrollbar">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function DeveloperProfilePanel({
  developers,
  selectedDeveloper,
  selectedDeveloperId,
  onSelect
}: {
  developers: DeveloperPreference[];
  selectedDeveloper: DeveloperPreference | null;
  selectedDeveloperId: string;
  onSelect: (developerId: string) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">Developer profile</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Candidate preference view</h2>
        </div>
        <select
          value={selectedDeveloperId}
          onChange={(event) => onSelect(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {developers.map((developer) => (
            <option key={developer.developerId} value={developer.developerId}>
              {developer.name}
            </option>
          ))}
        </select>
      </div>

      {!developers.length ? (
        <div className="mt-5">
          <EmptyPanel message="No sample developers found." />
        </div>
      ) : selectedDeveloper ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={selectedDeveloper.name} />
          <Field label="Nationality" value={selectedDeveloper.nationality} />
          <Field
            label="Preferred salary"
            value={formatSalary(selectedDeveloper.preferredSalaryMin, selectedDeveloper.preferredSalaryMax, selectedDeveloper.preferredCurrency)}
          />
          <Field label="Preferred locations" value={formatList(selectedDeveloper.preferredLocations)} />
          <Field label="Available tech stacks" value={formatList(selectedDeveloper.availableTechStacks)} wide />
          <Field label="Language certifications" value={formatDeveloperLanguages(selectedDeveloper)} wide />
          <Field label="Years of experience" value={`${selectedDeveloper.yearsOfExperience} years`} />
          <Field label="Target roles" value={formatList(selectedDeveloper.targetRoles)} />
          <Field label="Work style preference" value={humanize(selectedDeveloper.workStylePreference)} />
          <Field label="Relocation availability" value={selectedDeveloper.relocationAvailable ? "Available" : "Not available"} />
          <Field label="Visa support needed" value={selectedDeveloper.visaSupportNeeded ? "Needed" : "Not needed"} />
          <Field label="Preferred company types" value={formatList(selectedDeveloper.preferredCompanyTypes)} />
          <Field label="Resume summary" value={selectedDeveloper.resumeText} wide />
          <Field label="Motivation" value={selectedDeveloper.motivation ?? "Unknown"} wide />
          <Field label="Concerns" value={formatList(selectedDeveloper.concerns, "No concerns listed")} wide />
        </div>
      ) : null}
    </Card>
  );
}

function CompanyProfilePanel({
  profiles,
  selectedProfile,
  selectedRoleId,
  onSelect
}: {
  profiles: CompanyJobProfile[];
  selectedProfile: CompanyJobProfile | null;
  selectedRoleId: string;
  onSelect: (roleId: string) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">Company job profile</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Hiring criteria view</h2>
        </div>
        <select
          value={selectedRoleId}
          onChange={(event) => onSelect(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {profiles.map((profile) => (
            <option key={profile.roleId} value={profile.roleId}>
              {profile.companyName} / {profile.roleTitle}
            </option>
          ))}
        </select>
      </div>

      {!profiles.length ? (
        <div className="mt-5">
          <EmptyPanel message="No company profiles found." />
        </div>
      ) : selectedProfile ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Company name" value={selectedProfile.companyName} />
          <Field label="Role title" value={selectedProfile.roleTitle} />
          <Field label="Country" value={selectedProfile.country} />
          <Field label="Company type" value={selectedProfile.companyType} />
          <Field label="Role category" value={selectedProfile.roleCategory} />
          <Field label="Work style" value={humanize(selectedProfile.workStyle)} />
          <Field label="Required tech stacks" value={formatList(selectedProfile.requiredTechStacks)} wide />
          <Field label="Preferred tech stacks" value={formatList(selectedProfile.preferredTechStacks)} wide />
          <Field label="Required languages" value={formatLanguages(selectedProfile.requiredLanguages)} />
          <Field label="Locations" value={formatList(selectedProfile.locations)} />
          <Field
            label="Salary range"
            value={formatSalary(selectedProfile.salaryMin, selectedProfile.salaryMax, selectedProfile.salaryCurrency)}
          />
          <Field label="Experience range" value={formatExperience(selectedProfile)} />
          <Field label="Source confidence" value={humanize(selectedProfile.sourceConfidence)} />
          <Field label="Rubric ID" value={selectedProfile.rubricId} />
          <Field label="Notes" value={selectedProfile.notes ?? "Unknown"} wide />
        </div>
      ) : null}
    </Card>
  );
}

function CompanyMatchCard({ result, rank }: { result: DeveloperToCompanyFitResult; rank: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">#{rank}</Badge>
              <Badge tone="blue" icon={BriefcaseBusiness}>{humanize(result.recommendedNextStep)}</Badge>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">{result.companyName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{result.roleTitle}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overall fit</p>
            <p className="mt-1 text-4xl font-bold text-green-600">{clampScore(result.overallFitScore)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{result.explanation}</p>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">Score breakdown</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {developerScoreRows.map(([key, label]) => (
              <ScoreBar key={key} label={label} value={result.scoreBreakdown[key]} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ChipList title="Matched reasons" values={result.matchedReasons} tone="green" emptyLabel="No direct matched reasons yet." />
          <ChipList title="Missing signals" values={result.missingSignals} tone="amber" emptyLabel="No missing signals detected." />
          <ChipList title="Risks" values={result.risks} tone="rose" emptyLabel="No major risks detected." />
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">Recommended evidence missions</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {result.recommendedMissions.map((mission) => (
              <MissionCard key={mission.missionId} mission={mission} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CandidateMatchCard({
  result,
  developer,
  rank
}: {
  result: CompanyToDeveloperFitResult;
  developer: DeveloperPreference | undefined;
  rank: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">#{rank}</Badge>
              <Badge tone="blue" icon={UsersRound}>{humanize(result.recommendedRecruiterAction)}</Badge>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">{result.developerName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{developer?.nationality ?? "Unknown"} candidate</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overall fit</p>
            <p className="mt-1 text-4xl font-bold text-green-600">{clampScore(result.overallFitScore)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{result.explanation}</p>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">Score breakdown</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {companyScoreRows.map(([key, label]) => (
              <ScoreBar key={key} label={label} value={result.scoreBreakdown[key]} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ChipList title="Top match signals" values={result.topMatchSignals} tone="green" emptyLabel="No top signals detected." />
          <ChipList title="Missing signals" values={result.missingSignals} tone="amber" emptyLabel="No missing signals detected." />
          <ChipList title="Risks" values={result.risks} tone="rose" emptyLabel="No major risks detected." />
        </div>
      </div>
    </Card>
  );
}

function ValidationPanel({ summary }: { summary: CompanyJobProfilesValidationSummary }) {
  const commonWarnings = getCommonWarnings(summary);
  const warningLookup = new Set(commonWarnings.map(([warning]) => warning));
  const displayedWarnings = commonWarnings.length
    ? commonWarnings.slice(0, 8)
    : warningExamples.map((warning) => [warning, warningLookup.has(warning) ? 1 : 0] as [string, number]);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">Validation / Data Quality</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Explainable data quality status</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            BridgePass intentionally marks missing salary, language, or location data instead of inventing it. This keeps the matching explainable and improves trust.
          </p>
        </div>
        <Badge tone="amber" icon={AlertTriangle}>Warnings are review prompts</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Total profiles" value={summary.totalProfiles} />
        <Field label="Valid profiles" value={summary.validProfiles} />
        <Field label="Warning profiles" value={summary.warningProfiles} />
        <Field label="Invalid profiles" value={summary.invalidProfiles} />
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-bold text-slate-900">Common warnings</p>
        <div className="flex flex-wrap gap-2">
          {displayedWarnings.map(([warning, count]) => (
            <Badge key={warning} tone={count > 0 ? "amber" : "slate"}>
              {warning}{count > 0 ? ` (${count})` : ""}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function TwoSidedFitDashboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedCompanyRoleId, setSelectedCompanyRoleId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("developerToCompany");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>("EN");

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoadState("loading");
      try {
        const [companyJobProfiles, companyRubrics, companySignals, developerProfiles, metadata] = await Promise.all([
          loadCompanyJobProfiles(),
          loadCompanyRubrics(),
          loadCompanySignals(),
          loadSampleDeveloperProfiles(),
          loadFitEngineMetadata().catch(() => null)
        ]);

        const validationSummary = validateCompanyJobProfiles(companyJobProfiles, companyRubrics);

        if (!mounted) return;
        setData({
          companyJobProfiles,
          companyRubrics,
          companySignals,
          developerProfiles,
          metadata,
          validationSummary
        });
        setSelectedDeveloperId((current) => current || developerProfiles[0]?.developerId || "");
        setSelectedCompanyRoleId((current) => current || companyJobProfiles[0]?.roleId || "");
        setLoadState("ready");
      } catch (caught) {
        if (!mounted) return;
        setLoadState("error");
        setErrorMessage(caught instanceof Error ? caught.message : "Company criteria data could not be loaded.");
      }
    }

    void loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDeveloper = useMemo(() => {
    if (!data) return null;
    return data.developerProfiles.find((developer) => developer.developerId === selectedDeveloperId) ?? data.developerProfiles[0] ?? null;
  }, [data, selectedDeveloperId]);

  const selectedCompanyProfile = useMemo(() => {
    if (!data) return null;
    return data.companyJobProfiles.find((profile) => profile.roleId === selectedCompanyRoleId) ?? data.companyJobProfiles[0] ?? null;
  }, [data, selectedCompanyRoleId]);

  const developerRanking = useMemo(() => {
    if (!data || !selectedDeveloper) return { results: [] as DeveloperToCompanyFitResult[], error: null as string | null };

    try {
      return {
        results: rankCompaniesForDeveloper(
          selectedDeveloper,
          data.companyJobProfiles,
          data.companyRubrics,
          data.companySignals
        ).slice(0, 5),
        error: null
      };
    } catch {
      return { results: [] as DeveloperToCompanyFitResult[], error: "Ranking failed. Check Two-sided Fit Engine input data." };
    }
  }, [data, selectedDeveloper]);

  const companyRanking = useMemo(() => {
    if (!data || !selectedCompanyProfile) return { results: [] as CompanyToDeveloperFitResult[], error: null as string | null };

    try {
      return {
        results: rankDevelopersForCompany(
          selectedCompanyProfile,
          data.developerProfiles,
          data.companyRubrics,
          data.companySignals
        ),
        error: null
      };
    } catch {
      return { results: [] as CompanyToDeveloperFitResult[], error: "Ranking failed. Check Two-sided Fit Engine input data." };
    }
  }, [data, selectedCompanyProfile]);

  const allProfilesHaveWarnings = Boolean(
    data &&
      data.validationSummary.totalProfiles > 0 &&
      data.validationSummary.warningProfiles + data.validationSummary.invalidProfiles >= data.validationSummary.totalProfiles
  );

  if (loadState === "loading") return <LoadingPanel />;
  if (loadState === "error" || !data) return <ErrorPanel message={errorMessage || "Company criteria data could not be loaded."} />;

  const selectedCompanyDeveloper = (developerId: string) =>
    data.developerProfiles.find((developer) => developer.developerId === developerId);

  return (
    <main
      className="min-h-screen bg-[#F8FAF7] px-4 py-6 text-slate-900 md:px-8"
      style={{
        fontFamily:
          '"Noto Sans KR", "Noto Sans JP", "Noto Sans", "Inter", system-ui, sans-serif'
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
                  <Sparkles size={16} />
                  BridgePass
                </span>
                <Badge tone="green" icon={ShieldCheck}>Human review required</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">Two-sided Fit Engine</h1>
              <p className="mt-2 text-lg font-semibold text-slate-700">Match developers and companies in both directions.</p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                Stop searching blindly. Find companies that fit your stack, goals, language level, salary expectations, and career constraints.
              </p>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                BridgePass compares developer preferences with company-specific hiring criteria and turns gaps into evidence missions.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
                {(["한국어", "日本語", "EN"] as LanguageKey[]).map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setSelectedLanguage(language)}
                    className={classNames(
                      "min-h-9 rounded-md px-3 text-sm font-bold transition",
                      selectedLanguage === language ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {language}
                  </button>
                ))}
              </div>
              <div className="flex max-w-md flex-wrap justify-end gap-2">
                <Badge tone="slate" icon={Building2}>Company profiles {data.companyJobProfiles.length}</Badge>
                <Badge tone="slate" icon={UserRound}>Sample developers {data.developerProfiles.length}</Badge>
                <Badge tone="slate" icon={Database}>Rubrics {data.companyRubrics.length}</Badge>
                <Badge tone="green" icon={CheckCircle2}>Rule-based scoring active</Badge>
                <Badge tone="blue" icon={Sparkles}>Gemini optional</Badge>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-green-200 bg-white p-5 shadow-panel">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-700">BridgePass position</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Job boards show postings. BridgePass explains fit.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This debug surface shows the matching logic in both directions, with gaps, risks, and preparation work visible before anyone applies or interviews.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {["Developer preferences", "Company-specific criteria", "Fit score and gap analysis", "Evidence missions before applying"].map((step, index, steps) => (
                <div key={step} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="mt-3 text-sm font-bold leading-5 text-slate-950">{step}</p>
                  {index < steps.length - 1 ? (
                    <ArrowRight className="absolute right-3 top-4 hidden text-green-600 md:block" size={18} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Building2} label="Company Profiles" value={data.companyJobProfiles.length} helper="Loaded from companyJobProfiles.json" />
          <KpiCard icon={UsersRound} label="Sample Developers" value={data.developerProfiles.length} helper="Loaded from sampleDeveloperProfiles.json" tone="blue" />
          <KpiCard icon={Database} label="Company Rubrics" value={data.companyRubrics.length} helper="Company-specific criteria available" tone="slate" />
          <KpiCard icon={AlertTriangle} label="Warning Profiles" value={data.validationSummary.warningProfiles} helper="Warnings guide data enrichment" tone="amber" />
        </section>

        {allProfilesHaveWarnings || data.validationSummary.warningProfiles > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Warnings are expected because BridgePass does not invent unavailable salary or language data. Unknown fields should be improved with role-specific official job pages.
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-panel">
          <div className="grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("developerToCompany")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "developerToCompany" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <UserRound size={18} />
              Developer → Company Fit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("companyToDeveloper")}
              className={classNames(
                "flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition",
                activeTab === "companyToDeveloper" ? "bg-green-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Building2 size={18} />
              Company → Developer Fit
            </button>
          </div>
        </section>

        {activeTab === "developerToCompany" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
            <DeveloperProfilePanel
              developers={data.developerProfiles}
              selectedDeveloper={selectedDeveloper}
              selectedDeveloperId={selectedDeveloperId}
              onSelect={setSelectedDeveloperId}
            />
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-green-700">Top Company Matches</p>
                  <h2 className="text-2xl font-bold text-slate-950">Best-fit companies and roles</h2>
                </div>
                <Badge tone="green" icon={Target}>Top 5 ranked by engine</Badge>
              </div>
              {developerRanking.error ? (
                <EmptyPanel message={developerRanking.error} />
              ) : !data.companyJobProfiles.length ? (
                <EmptyPanel message="No company profiles found." />
              ) : developerRanking.results.length ? (
                developerRanking.results.map((result, index) => (
                  <CompanyMatchCard key={`${result.companyId}-${result.roleId}`} result={result} rank={index + 1} />
                ))
              ) : (
                <EmptyPanel message="Ranking failed. Check Two-sided Fit Engine input data." />
              )}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
            <CompanyProfilePanel
              profiles={data.companyJobProfiles}
              selectedProfile={selectedCompanyProfile}
              selectedRoleId={selectedCompanyRoleId}
              onSelect={setSelectedCompanyRoleId}
            />
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-green-700">Recommended Candidates</p>
                  <h2 className="text-2xl font-bold text-slate-950">Best-fit developers for this role</h2>
                </div>
                <Badge tone="green" icon={BadgeCheck}>Human recruiter review next</Badge>
              </div>
              {companyRanking.error ? (
                <EmptyPanel message={companyRanking.error} />
              ) : !data.developerProfiles.length ? (
                <EmptyPanel message="No sample developers found." />
              ) : companyRanking.results.length ? (
                companyRanking.results.map((result, index) => (
                  <CandidateMatchCard
                    key={`${result.companyId}-${result.roleId}-${result.developerId}`}
                    result={result}
                    developer={selectedCompanyDeveloper(result.developerId)}
                    rank={index + 1}
                  />
                ))
              ) : (
                <EmptyPanel message="Ranking failed. Check Two-sided Fit Engine input data." />
              )}
            </div>
          </section>
        )}

        <ValidationPanel summary={data.validationSummary} />

        <details className="group rounded-lg border border-slate-200 bg-white shadow-panel">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-700">Raw Debug JSON</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Inspect selected inputs and top results</h2>
            </div>
            <ChevronDown className="shrink-0 text-slate-500 transition group-open:rotate-180" size={22} />
          </summary>
          <div className="grid gap-4 border-t border-slate-200 p-5">
            <JsonBlock title="Selected developer JSON" value={selectedDeveloper} />
            <JsonBlock title="Selected company profile JSON" value={selectedCompanyProfile} />
            <JsonBlock title="Top developer-to-company result JSON" value={developerRanking.results[0] ?? null} />
            <JsonBlock title="Top company-to-developer result JSON" value={companyRanking.results[0] ?? null} />
            <JsonBlock title="Validation summary JSON" value={data.validationSummary} />
          </div>
        </details>

        <footer className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={20} />
              <p>
                This score is not an automated hiring decision. It is a guidance signal for discovery, preparation, and human review.
              </p>
            </div>
            {data.metadata ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge tone="blue">Dataset {data.metadata.version}</Badge>
                <Badge tone="blue">Generated {data.metadata.generatedAt}</Badge>
              </div>
            ) : null}
          </div>
        </footer>
      </div>
    </main>
  );
}

export default TwoSidedFitDashboard;
