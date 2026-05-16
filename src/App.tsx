import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Database,
  Layers3,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  analyzeProfile,
  buildBaseline,
  extractSignals,
  getBaselines,
  getSignals,
  getSources,
  loadSampleData,
  refactorIntroduction
} from "./api/client";
import {
  countryOptionsByLocale,
  defaultProfiles,
  formatRole,
  getCopy,
  isDefaultProfile,
  localeOptions,
  sourceTypeLabels,
  type AppCopy
} from "./i18n";
import type {
  BridgeLabRecommendation,
  CareerSignalState,
  DeveloperProfile,
  GapAnalysisResult,
  Locale,
  RecruiterLensResult,
  RoleBaseline
} from "../shared/types";

type Screen = "dashboard" | "signals" | "profile" | "analysis" | "recruiter" | "passport";

const screenConfig: Array<{ id: Screen; icon: typeof BarChart3 }> = [
  { id: "dashboard", icon: BarChart3 },
  { id: "signals", icon: Database },
  { id: "profile", icon: UserRound },
  { id: "analysis", icon: Sparkles },
  { id: "recruiter", icon: MessageSquareText },
  { id: "passport", icon: BadgeCheck }
];

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatCount(count: number, suffix: string, locale: Locale) {
  return locale === "en" ? `${count} ${suffix}` : `${count}${suffix}`;
}

function countryLabel(country: string, locale: Locale) {
  return countryOptionsByLocale[locale].find((option) => option.value === country)?.label ?? country;
}

function Button({
  children,
  icon: Icon,
  variant = "primary",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: typeof Sparkles;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={classNames(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-bridge-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-bridge-teal text-white hover:bg-[#0B6867]",
        variant === "secondary" && "border border-slate-300 bg-white text-ink hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        props.className
      )}
      disabled={props.disabled || loading}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
      {title}
    </div>
  );
}

function Tag({
  children,
  tone = "slate"
}: {
  children: React.ReactNode;
  tone?: "slate" | "teal" | "coral" | "amber";
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    coral: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900"
  };
  return (
    <span className={classNames("inline-flex rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-bridge-teal" : value >= 55 ? "bg-bridge-amber" : "bg-bridge-coral";
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xl font-bold text-ink">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={classNames("h-full rounded-full", tone)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-bridge-blue">{eyebrow}</p> : null}
      <h2 className="text-xl font-bold text-ink">{title}</h2>
    </div>
  );
}

function SignalList({
  title,
  values,
  tone,
  emptyLabel
}: {
  title: string;
  values: string[];
  tone?: "slate" | "teal" | "coral" | "amber";
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? (
          values.map((value, index) => (
            <Tag key={`${title}-${value}-${index}`} tone={tone}>
              {value}
            </Tag>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function RecommendationList({
  items,
  copy
}: {
  items: BridgeLabRecommendation[];
  copy: AppCopy;
}) {
  if (!items.length) return <EmptyState title={copy.empty.recommendations} />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.activity} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-ink">{item.activity}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
          <div className="mt-3 grid gap-2 text-sm">
            <p>
              <span className="font-semibold text-slate-700">{copy.recommendations.outcome}</span>{" "}
              {item.expectedOutcome}
            </p>
            <p>
              <span className="font-semibold text-slate-700">{copy.recommendations.proof}</span>{" "}
              {item.proofCreated}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function nextCompanyStep(result: GapAnalysisResult | undefined, copy: AppCopy): string {
  if (!result) return copy.passport.nextSteps.studyFirst;
  if (result.overallFitScore >= 82 && result.evidenceConfidenceScore >= 70) {
    return copy.passport.nextSteps.casualInterview;
  }
  if (result.technicalFitScore >= 75 && result.collaborationEvidenceScore >= 65) {
    return copy.passport.nextSteps.trialProject;
  }
  if (result.communicationFitScore >= 70 && result.motivationFitScore >= 70) {
    return copy.passport.nextSteps.officeTour;
  }
  return copy.passport.nextSteps.studyFirst;
}

function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const copy = getCopy(locale);
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [state, setState] = useState<CareerSignalState>({ sources: [], signals: [], baselines: [] });
  const [selectedRole, setSelectedRole] = useState("Junior Frontend Developer");
  const [profile, setProfile] = useState<DeveloperProfile>(defaultProfiles.en);
  const [analysis, setAnalysis] = useState<GapAnalysisResult | undefined>();
  const [analysisBaseline, setAnalysisBaseline] = useState<RoleBaseline | undefined>();
  const [recruiterLens, setRecruiterLens] = useState<RecruiterLensResult | undefined>();
  const [loading, setLoading] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "en"
        ? "BridgePass Career Signal Engine"
        : locale === "ko"
          ? "BridgePass 커리어 시그널 엔진"
          : "BridgePass キャリアシグナルエンジン";
  }, [locale]);

  useEffect(() => {
    Promise.all([getSources(), getSignals(), getBaselines()])
      .then(([sourcesResult, signalsResult, baselinesResult]) => {
        setState({
          sources: sourcesResult.sources,
          signals: signalsResult.signals,
          baselines: baselinesResult.baselines
        });
      })
      .catch(() => undefined);
  }, []);

  const roles = useMemo(() => {
    const fromSources = state.sources.map((source) => source.role);
    const fromBaselines = state.baselines.map((baseline) => baseline.role);
    return [...new Set([...fromSources, ...fromBaselines, profile.targetRole])];
  }, [profile.targetRole, state.baselines, state.sources]);

  const selectedSources = state.sources.filter((source) => source.role === selectedRole);
  const selectedSignals = state.signals.filter((signal) => signal.role === selectedRole);
  const selectedBaseline = state.baselines.find((baseline) => baseline.role === selectedRole);

  function handleLocaleChange(nextLocale: Locale) {
    setLocale(nextLocale);
    setProfile((current) => {
      const base = isDefaultProfile(current) ? defaultProfiles[nextLocale] : current;
      return { ...base, uiLocale: nextLocale };
    });
  }

  async function runAction<T>(key: string, action: () => Promise<T>): Promise<T | undefined> {
    setError(undefined);
    setLoading(key);
    try {
      return await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.errorFallback);
      return undefined;
    } finally {
      setLoading(undefined);
    }
  }

  async function handleLoadSamples() {
    const result = await runAction("load", loadSampleData);
    if (result) {
      setState((current) => ({ ...current, sources: result.sources }));
      setSelectedRole(result.sources[0]?.role ?? selectedRole);
      setActiveScreen("signals");
    }
  }

  async function handleExtractSignals() {
    const result = await runAction("extract", extractSignals);
    if (result) {
      setState((current) => ({ ...current, signals: result.signals }));
      setActiveScreen("signals");
    }
  }

  async function handleBuildBaseline() {
    const result = await runAction("baseline", buildBaseline);
    if (result) {
      setState((current) => ({ ...current, baselines: result.baselines }));
      setAnalysisBaseline(result.baselines.find((baseline) => baseline.role === profile.targetRole));
      setActiveScreen("signals");
    }
  }

  async function handleAnalyzeProfile() {
    const profileWithLocale = { ...profile, uiLocale: locale };
    const result = await runAction("analysis", () => analyzeProfile(profileWithLocale));
    if (result) {
      setAnalysis(result.result);
      setAnalysisBaseline(result.baseline);
      setRecruiterLens({
        originalSelfIntroduction: profile.selfIntroduction,
        rewrittenSelfIntroduction: result.result.rewrittenSelfIntroduction,
        explanation: result.result.recruiterLensFeedback,
        missingElements: result.result.missingSignals.slice(0, 5),
        safetyNote: result.result.safetyNote
      });
      setActiveScreen("analysis");
    }
  }

  async function handleRecruiterLens() {
    const profileWithLocale = { ...profile, uiLocale: locale };
    const result = await runAction("recruiter", () => refactorIntroduction(profileWithLocale));
    if (result) {
      setRecruiterLens(result.result);
      setAnalysisBaseline(result.baseline);
      setActiveScreen("recruiter");
    }
  }

  function updateProfile<K extends keyof DeveloperProfile>(key: K, value: DeveloperProfile[K]) {
    setProfile((current) => ({ ...current, uiLocale: locale, [key]: value }));
    if (key === "targetRole") setSelectedRole(String(value));
  }

  const roleOptions = roles.map((role) => ({ value: role, label: formatRole(role, locale) }));

  return (
    <div className="min-h-screen bg-bridge-paper text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-bridge-teal text-white">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-bridge-blue">BridgePass</p>
              <h1 className="text-2xl font-bold text-ink">{copy.appTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <span>{copy.language}</span>
              <select
                value={locale}
                onChange={(event) => handleLocaleChange(event.target.value as Locale)}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {screenConfig.map((screen) => {
              const Icon = screen.icon;
              return (
                <button
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id)}
                  className={classNames(
                    "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                    activeScreen === screen.id
                      ? "bg-ink text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon size={16} />
                  {copy.nav[screen.id]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error ? (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        {activeScreen === "dashboard" ? (
          <section>
            <SectionTitle title={copy.dashboardTitle} eyebrow={copy.hackathon} />
            <div className="grid gap-4 lg:grid-cols-3">
              <button
                onClick={handleLoadSamples}
                className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-bridge-teal"
              >
                <Database className="mb-5 text-bridge-teal" size={28} />
                <h3 className="text-lg font-bold text-ink">{copy.cards.load}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatCount(state.sources.length, copy.cards.sampleSuffix, locale)}
                </p>
              </button>
              <button
                onClick={handleExtractSignals}
                className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-bridge-blue"
              >
                {loading === "extract" ? (
                  <Loader2 className="mb-5 animate-spin text-bridge-blue" size={28} />
                ) : (
                  <Sparkles className="mb-5 text-bridge-blue" size={28} />
                )}
                <h3 className="text-lg font-bold text-ink">{copy.cards.extract}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatCount(state.signals.length, copy.cards.signalSuffix, locale)}
                </p>
              </button>
              <button
                onClick={handleBuildBaseline}
                className="rounded-md border border-slate-200 bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-bridge-amber"
              >
                {loading === "baseline" ? (
                  <Loader2 className="mb-5 animate-spin text-bridge-amber" size={28} />
                ) : (
                  <Layers3 className="mb-5 text-bridge-amber" size={28} />
                )}
                <h3 className="text-lg font-bold text-ink">{copy.cards.baseline}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatCount(state.baselines.length, copy.cards.baselineSuffix, locale)}
                </p>
              </button>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                <SectionTitle title={copy.productMessage} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {copy.productMessages.map((message, index) => (
                    <div
                      key={message}
                      className={classNames(
                        "rounded-md border p-3 text-sm font-semibold",
                        index >= 4
                          ? "border-teal-200 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      )}
                    >
                      {message}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                <SectionTitle title={copy.pipelineStatus} />
                <div className="grid gap-3">
                  <StatusRow label={copy.status.raw} value={state.sources.length} />
                  <StatusRow label={copy.status.signals} value={state.signals.length} />
                  <StatusRow label={copy.status.baselines} value={state.baselines.length} />
                  <StatusRow label={copy.status.latest} value={analysis ? 1 : 0} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeScreen === "signals" ? (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title={copy.signals.title} eyebrow={copy.signals.eyebrow} />
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <Button icon={RefreshCcw} variant="secondary" loading={loading === "extract"} onClick={handleExtractSignals}>
                  {copy.buttons.extract}
                </Button>
                <Button icon={Layers3} loading={loading === "baseline"} onClick={handleBuildBaseline}>
                  {copy.buttons.baseline}
                </Button>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <section>
                <SectionTitle title={copy.signals.raw} />
                <div className="grid gap-3">
                  {selectedSources.length ? (
                    selectedSources.map((source) => (
                      <article key={source.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Tag tone={source.country === "Japan" ? "teal" : "amber"}>
                            {countryLabel(source.country, locale)}
                          </Tag>
                          <Tag>{sourceTypeLabels[locale][source.sourceType]}</Tag>
                          <Tag>{source.industry}</Tag>
                        </div>
                        <h3 className="font-bold text-ink">{source.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{source.summaryText}</p>
                      </article>
                    ))
                  ) : (
                    <EmptyState title={copy.empty.samples} />
                  )}
                </div>
              </section>

              <section>
                <SectionTitle title={copy.signals.extracted} />
                <div className="grid gap-3">
                  {selectedSignals.length ? (
                    selectedSignals.map((signal) => (
                      <article key={signal.sourceId} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Tag tone="teal">{signal.sourceId}</Tag>
                          <Tag tone="amber">{signal.requiredLanguageLevel}</Tag>
                        </div>
                        <div className="grid gap-4">
                          <SignalList
                            title={copy.signals.requiredTech}
                            values={signal.requiredTechnicalSkills}
                            tone="teal"
                            emptyLabel={copy.empty.noneYet}
                          />
                          <SignalList
                            title={copy.signals.recommendedEvidence}
                            values={signal.recommendedEvidence}
                            tone="amber"
                            emptyLabel={copy.empty.noneYet}
                          />
                          <SignalList
                            title={copy.signals.commonConcerns}
                            values={signal.commonConcerns}
                            tone="coral"
                            emptyLabel={copy.empty.noneYet}
                          />
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState title={copy.empty.signals} />
                  )}
                </div>
              </section>
            </div>

            <section className="mt-8">
              <SectionTitle title={copy.signals.roleBaseline} />
              {selectedBaseline ? (
                <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-panel lg:grid-cols-2">
                  <SignalList title={copy.signals.technicalBaseline} values={selectedBaseline.technicalBaseline} tone="teal" emptyLabel={copy.empty.noneYet} />
                  <SignalList title={copy.signals.communicationBaseline} values={selectedBaseline.communicationBaseline} tone="amber" emptyLabel={copy.empty.noneYet} />
                  <SignalList title={copy.signals.softSkillBaseline} values={selectedBaseline.softSkillBaseline} emptyLabel={copy.empty.noneYet} />
                  <SignalList title={copy.signals.motivationBaseline} values={selectedBaseline.motivationBaseline} emptyLabel={copy.empty.noneYet} />
                  <SignalList title={copy.signals.evidenceBaseline} values={selectedBaseline.evidenceBaseline} tone="teal" emptyLabel={copy.empty.noneYet} />
                  <SignalList title={copy.signals.commonRisks} values={selectedBaseline.commonRisks} tone="coral" emptyLabel={copy.empty.noneYet} />
                </div>
              ) : (
                <EmptyState title={copy.empty.baseline} />
              )}
            </section>
          </section>
        ) : null}

        {activeScreen === "profile" ? (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title={copy.profile.title} eyebrow={copy.profile.eyebrow} />
              <div className="flex flex-wrap gap-2">
                <Button icon={Sparkles} loading={loading === "analysis"} onClick={handleAnalyzeProfile}>
                  {copy.buttons.analyze}
                </Button>
                <Button icon={MessageSquareText} variant="secondary" loading={loading === "recruiter"} onClick={handleRecruiterLens}>
                  {copy.buttons.recruiterLens}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-panel lg:grid-cols-2">
              <Field label={copy.profile.name} value={profile.name} onChange={(value) => updateProfile("name", value)} />
              <Field label={copy.profile.nationality} value={profile.nationality} onChange={(value) => updateProfile("nationality", value)} />
              <SelectField
                label={copy.profile.targetCountry}
                value={profile.targetCountry}
                options={countryOptionsByLocale[locale]}
                onChange={(value) => updateProfile("targetCountry", value as DeveloperProfile["targetCountry"])}
              />
              <SelectField
                label={copy.profile.targetRole}
                value={profile.targetRole}
                options={roleOptions}
                onChange={(value) => updateProfile("targetRole", value)}
              />
              <TextArea label={copy.profile.techStack} value={profile.techStack} onChange={(value) => updateProfile("techStack", value)} />
              <TextArea label={copy.profile.languageLevels} value={profile.languageLevels} onChange={(value) => updateProfile("languageLevels", value)} />
              <TextArea label={copy.profile.projectExperience} rows={5} value={profile.projectExperience} onChange={(value) => updateProfile("projectExperience", value)} />
              <TextArea label={copy.profile.selfIntroduction} rows={5} value={profile.selfIntroduction} onChange={(value) => updateProfile("selfIntroduction", value)} />
              <TextArea label={copy.profile.motivation} rows={5} value={profile.motivation} onChange={(value) => updateProfile("motivation", value)} />
              <TextArea label={copy.profile.anxiety} rows={5} value={profile.anxiety} onChange={(value) => updateProfile("anxiety", value)} />
            </div>
          </section>
        ) : null}

        {activeScreen === "analysis" ? (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title={copy.analysis.title} eyebrow={formatRole(analysisBaseline?.role ?? profile.targetRole, locale)} />
              <Button icon={Sparkles} loading={loading === "analysis"} onClick={handleAnalyzeProfile}>
                {copy.buttons.refreshAnalysis}
              </Button>
            </div>
            {analysis ? (
              <div className="grid gap-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <ScoreBar label={copy.analysis.overall} value={analysis.overallFitScore} />
                  <ScoreBar label={copy.analysis.technical} value={analysis.technicalFitScore} />
                  <ScoreBar label={copy.analysis.communication} value={analysis.communicationFitScore} />
                  <ScoreBar label={copy.analysis.motivation} value={analysis.motivationFitScore} />
                  <ScoreBar label={copy.analysis.evidence} value={analysis.evidenceConfidenceScore} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                    <SignalList title={copy.analysis.matched} values={analysis.matchedSignals} tone="teal" emptyLabel={copy.empty.noneYet} />
                    <div className="mt-5">
                      <SignalList title={copy.analysis.suggestedTags} values={analysis.suggestedTags} tone="amber" emptyLabel={copy.empty.noneYet} />
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                    <SignalList title={copy.analysis.missing} values={analysis.missingSignals} tone="coral" emptyLabel={copy.empty.noneYet} />
                    <div className="mt-5">
                      <SignalList title={copy.analysis.risks} values={analysis.risks} tone="coral" emptyLabel={copy.empty.noneYet} />
                    </div>
                  </div>
                </div>
                <section>
                  <SectionTitle title={copy.analysis.recommendedActions} />
                  <RecommendationList items={analysis.recommendedActions} copy={copy} />
                </section>
                <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  {analysis.safetyNote}
                </p>
              </div>
            ) : (
              <EmptyState title={copy.empty.analysis} />
            )}
          </section>
        ) : null}

        {activeScreen === "recruiter" ? (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title={copy.recruiter.title} eyebrow={formatRole(profile.targetRole, locale)} />
              <Button icon={MessageSquareText} loading={loading === "recruiter"} onClick={handleRecruiterLens}>
                {copy.buttons.refactor}
              </Button>
            </div>
            {recruiterLens ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                  <h3 className="mb-3 font-bold text-ink">{copy.recruiter.original}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {recruiterLens.originalSelfIntroduction}
                  </p>
                </article>
                <article className="rounded-md border border-teal-200 bg-white p-5 shadow-panel">
                  <h3 className="mb-3 font-bold text-ink">{copy.recruiter.rewritten}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {recruiterLens.rewrittenSelfIntroduction}
                  </p>
                </article>
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                  <SignalList title={copy.recruiter.changed} values={recruiterLens.explanation} tone="teal" emptyLabel={copy.empty.noneYet} />
                </article>
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                  <SignalList title={copy.recruiter.missing} values={recruiterLens.missingElements} tone="coral" emptyLabel={copy.empty.noneYet} />
                </article>
              </div>
            ) : (
              <EmptyState title={copy.empty.recruiter} />
            )}
          </section>
        ) : null}

        {activeScreen === "passport" ? (
          <section>
            <SectionTitle title={copy.passport.title} eyebrow={copy.passport.eyebrow} />
            {analysis ? (
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-ink text-white">
                      <UserRound size={26} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink">{profile.name}</h3>
                      <p className="text-sm text-slate-600">
                        {locale === "en"
                          ? `${profile.nationality} ${copy.passport.applicantTargeting} ${countryLabel(profile.targetCountry, locale)}`
                          : `${profile.nationality} ${copy.passport.applicantTargeting}: ${countryLabel(profile.targetCountry, locale)}`}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm">
                    <PassportRow label={copy.passport.targetRole} value={formatRole(profile.targetRole, locale)} />
                    <PassportRow label={copy.passport.evidenceLevel} value={`${analysis.evidenceConfidenceScore}/100`} />
                    <PassportRow label={copy.passport.recommendedNextStep} value={nextCompanyStep(analysis, copy)} />
                    <PassportRow
                      label={copy.passport.baselineSources}
                      value={formatCount(analysisBaseline?.sourceCount ?? 0, copy.passport.samples, locale)}
                    />
                  </div>
                </article>
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                  <div className="grid gap-5">
                    <SignalList title={copy.passport.verifiedTags} values={analysis.suggestedTags} tone="amber" emptyLabel={copy.empty.noneYet} />
                    <SignalList title={copy.passport.strengths} values={analysis.matchedSignals.slice(0, 8)} tone="teal" emptyLabel={copy.empty.noneYet} />
                    <SignalList title={copy.passport.risks} values={analysis.risks.slice(0, 8)} tone="coral" emptyLabel={copy.empty.noneYet} />
                  </div>
                </article>
                <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel lg:col-span-2">
                  <h3 className="mb-3 font-bold text-ink">{copy.passport.summary}</h3>
                  <p className="text-sm leading-6 text-slate-700">{analysis.rewrittenSelfIntroduction}</p>
                </article>
              </div>
            ) : (
              <EmptyState title={copy.empty.passport} />
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-lg font-bold text-ink">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-bridge-teal focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-bridge-teal focus:ring-2 focus:ring-teal-100"
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  rows = 3,
  onChange
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-bridge-teal focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-slate-100 pb-2 last:border-b-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}

export default App;
