'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { MARKETS, getCurrentMarket } from "@shared/market";
import { analyzeProfile } from "@src/api/client";
import { getMarketDeveloperProfile } from "@src/lib/marketAdapter";
import type { GapAnalysisResult, RoleBaseline } from "@shared/types";

type AnalysisState = {
  result: GapAnalysisResult;
  baseline: RoleBaseline;
};

export default function DeveloperDashboard() {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [mounted, setMounted] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisLocked, setAnalysisLocked] = useState<string | null>(null);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  useEffect(() => {
    setAnalysis(null);
    setAnalysisLocked(null);
  }, [market.id]);

  const profile = getMarketDeveloperProfile(market);

  async function handleAnalyzeProfile() {
    setAnalysisLoading(true);
    setAnalysisLocked(null);

    try {
      const response = await analyzeProfile(profile);
      setAnalysis(response);
    } catch (error) {
      setAnalysis(null);
      setAnalysisLocked(error instanceof Error ? error.message : "AI analysis is currently unavailable.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const strongPoints = analysis
    ? analysis.result.suggestedTags.slice(0, 4).map((label, index) => ({
        label,
        color:
          index === 0
            ? "bg-bridge-teal/10 text-bridge-teal"
            : index === 1
              ? "bg-bridge-primary/20 text-bridge-teal"
              : index === 2
                ? "bg-bridge-blue/10 text-bridge-blue"
                : "bg-bridge-coral/10 text-bridge-coral"
      }))
    : [
        { label: "Fluent Technical Keigo", color: "bg-bridge-teal/10 text-bridge-teal" },
        { label: "Cross-Cultural UI Sensitivity", color: "bg-bridge-primary/20 text-bridge-teal" },
        { label: "Bridge-Builder", color: "bg-bridge-blue/10 text-bridge-blue" },
        { label: "Agile Adaptability", color: "bg-bridge-coral/10 text-bridge-coral" }
      ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-ink tracking-tight mb-2">
              Annyeong, <span className="text-bridge-primary">{profile.name}!</span>
            </h1>
            <p className="text-gray-500 text-lg">
              Your cultural resonance with the{" "}
              <span className="font-semibold text-bridge-teal">{market.targetCountry}</span> market is growing.
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-panel border border-gray-100 flex items-center space-x-4">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                AI Signal
              </span>
              <span className="text-xl font-black text-bridge-primary">
                {analysis ? `${analysis.result.overallFitScore}/100` : "Ready"}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Target Role
              </span>
              <span className="text-xs font-bold text-gray-500">{profile.targetRole}</span>
            </div>
          </div>
        </div>

        <div className="bg-bridge-primary/5 p-6 rounded-2xl border border-bridge-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-bridge-teal flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Market Perspective Insight
            </h3>
            <p className="text-gray-700 leading-relaxed italic">
              {analysis
                ? `"${analysis.result.recruiterLensFeedback[0] ?? analysis.result.safetyNote}"`
                : `"Run the profile analysis to replace this frame with recruiter-facing evidence for ${market.targetCountry}."`}
            </p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-bridge-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-ink flex items-center">
                <span className="w-1.5 h-6 bg-bridge-primary rounded-full mr-3" />
                Your Strong Points
              </h2>
              <button
                onClick={handleAnalyzeProfile}
                disabled={analysisLoading}
                className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50"
              >
                {analysisLoading ? "Analyzing..." : "Run Profile Analysis"}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {strongPoints.map((point) => (
                <span key={point.label} className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${point.color}`}>
                  {point.label}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
            <h2 className="text-xl font-bold text-ink mb-5 flex items-center">
              <span className="w-1.5 h-6 bg-bridge-teal rounded-full mr-3" />
              AI Profile Analysis
            </h2>

            {analysisLocked ? (
              <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
                <p className="text-sm font-bold text-bridge-coral">AI section locked</p>
                <p className="mt-1 text-sm text-gray-600">
                  {analysisLocked} Configure the Gemini API key and retry this action.
                </p>
              </div>
            ) : analysis ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ["Technical", analysis.result.technicalFitScore],
                    ["Communication", analysis.result.communicationFitScore],
                    ["Motivation", analysis.result.motivationFitScore],
                    ["Evidence", analysis.result.evidenceConfidenceScore]
                  ].map(([label, score]) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                      <p className="mt-1 text-2xl font-black text-ink">{score}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignalList title="Matched Signals" items={analysis.result.matchedSignals} tone="good" />
                  <SignalList title="Missing Signals" items={analysis.result.missingSignals} tone="risk" />
                </div>
                <SignalList
                  title="Recommended Actions"
                  items={analysis.result.recommendedActions.map((action) => action.activity)}
                  tone="neutral"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 leading-relaxed">
                This panel calls the existing BE-AI profile analysis API on demand. Until it runs, the dashboard keeps the
                static signal-first frame visible.
              </p>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink flex items-center">
                <span className="w-1.5 h-6 bg-bridge-teal rounded-full mr-3" />
                Cultural Engagement
              </h2>
              <Link href="/forums" className="text-bridge-primary font-semibold hover:underline text-sm">
                Open Forums &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-bridge-primary transition-all group cursor-pointer shadow-panel">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-bridge-teal/10 text-bridge-teal text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    Nuance
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">Updated 2h ago</span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-bridge-primary">Code Review Etiquette</h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  How to give constructive feedback in {market.targetCountry} without being too direct.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-bridge-primary transition-all group cursor-pointer shadow-panel">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-bridge-blue/10 text-bridge-blue text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    Growth
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">4 New Insights</span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-bridge-primary">Startup Trends 2026</h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  The rise of React Server Components in {market.targetCountry}'s startup scene.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-ink text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-bridge-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-bridge-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-bridge-primary">AI Practice Coach</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Refine your self-introduction and practice market-specific interview framing.
              </p>
              <Link href="/developer/coach" className="bg-bridge-primary text-ink px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                Start Practice
              </Link>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-bridge-primary/10 rounded-full blur-2xl group-hover:bg-bridge-primary/20 transition-colors" />
          </section>

          <div className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Why Invisible?
            </h3>
            <p className="text-xs text-gray-500 leading-loose">
              We avoid final hiring judgments. The AI modules surface evidence, risks, and context so recruiters and
              candidates can make better-informed decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalList({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: "good" | "risk" | "neutral";
}) {
  const color =
    tone === "good" ? "text-bridge-teal" : tone === "risk" ? "text-bridge-coral" : "text-bridge-blue";

  return (
    <div>
      <h3 className={`text-sm font-black uppercase tracking-widest ${color}`}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 5).map((item) => (
          <li key={item} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
