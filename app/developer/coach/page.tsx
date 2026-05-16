'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentMarket } from "@shared/market";
import { refactorIntroduction } from "@src/api/client";
import { getMarketDeveloperProfile } from "@src/lib/marketAdapter";
import type { MarketConfig } from "@shared/market";
import type { RecruiterLensResult, RoleBaseline } from "@shared/types";

type Message = {
  role: "coach" | "user";
  text: string;
};

type RewriteState = {
  result: RecruiterLensResult;
  baseline: RoleBaseline;
};

export default function AICoachPage() {
  const [market, setMarket] = useState<MarketConfig | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text:
        "Welcome to your safe-practice environment. First, generate a recruiter rewrite, then use the prompt below to rehearse your answer."
    }
  ]);
  const [input, setInput] = useState("");
  const [rewrite, setRewrite] = useState<RewriteState | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteLocked, setRewriteLocked] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  useEffect(() => {
    setRewrite(null);
    setRewriteLocked(null);
  }, [market?.id]);

  if (!mounted || !market) return <div className="min-h-screen bg-bridge-paper" />;

  const profile = getMarketDeveloperProfile(market);

  async function handleRewrite() {
    setRewriteLoading(true);
    setRewriteLocked(null);

    try {
      const response = await refactorIntroduction(profile);
      setRewrite(response);
    } catch (error) {
      setRewrite(null);
      setRewriteLocked(error instanceof Error ? error.message : "Self-introduction rewrite is unavailable.");
    } finally {
      setRewriteLoading(false);
    }
  }

  function handleSend() {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((current) => [
      ...current,
      { role: "user", text: userMessage },
      {
        role: "coach",
        text:
          "Practice prompt: connect that answer to one concrete project result, one teamwork behavior, and one reason this target market matters to you."
      }
    ]);
    setInput("");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex justify-between items-center">
        <Link href="/developer" className="text-sm font-bold text-gray-400 hover:text-bridge-primary transition-colors flex items-center">
          &larr; Back to Dashboard
        </Link>
        <div className="bg-bridge-coral/10 text-bridge-coral px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          Safe Practice Zone
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
        <section className="bg-white p-8 rounded-3xl shadow-panel border border-gray-100">
          <div className="w-16 h-16 bg-bridge-primary/10 text-bridge-primary rounded-2xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-ink mb-4">Your Personal AI Coach</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Practice for your {market.targetCountry} interview by rewriting your self-introduction through the existing
            recruiter lens module.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-teal">100%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Private</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-primary">Safe</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">No Hiring Decision</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-blue">Real</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">BE-AI Module</span>
            </div>
          </div>

          <button
            onClick={handleRewrite}
            disabled={rewriteLoading}
            className="w-full bg-ink text-white px-6 py-4 rounded-2xl font-bold hover:bg-black transition-colors shadow-lg disabled:opacity-50"
          >
            {rewriteLoading ? "Rewriting..." : "Generate Recruiter Rewrite"}
          </button>

          <button
            onClick={() => setChatStarted((current) => !current)}
            className="mt-3 w-full bg-gray-50 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            {chatStarted ? "Hide Practice Prompt" : "Open Practice Prompt"}
          </button>
        </section>

        <section className="bg-white rounded-3xl shadow-panel border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">Recruiter Lens Output</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{profile.targetRole}</h2>
          </div>

          <div className="p-6 space-y-5">
            {rewriteLocked ? (
              <div className="rounded-xl border border-bridge-coral/30 bg-bridge-coral/10 p-4">
                <p className="text-sm font-bold text-bridge-coral">AI section locked</p>
                <p className="mt-1 text-sm text-gray-600">
                  {rewriteLocked} Configure the Gemini API key and retry this action.
                </p>
              </div>
            ) : rewrite ? (
              <>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">
                    Rewritten Self-Introduction
                  </h3>
                  <p className="rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                    {rewrite.result.rewrittenSelfIntroduction}
                  </p>
                </div>
                <InsightList title="Why It Is Stronger" items={rewrite.result.explanation} />
                <InsightList title="Missing Credibility Elements" items={rewrite.result.missingElements} />
                <p className="text-xs leading-relaxed text-gray-400">{rewrite.result.safetyNote}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500 leading-relaxed">
                This area is intentionally empty until the real refactor API returns. It will not show mock AI output.
              </p>
            )}
          </div>
        </section>
      </div>

      {chatStarted ? (
        <section className="mt-6 bg-white rounded-3xl shadow-panel border border-gray-100 flex flex-col h-[520px] overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Guided Practice</h3>
              <p className="text-[10px] font-bold text-bridge-teal uppercase tracking-widest">
                Mock Interview: Senior EM
              </p>
            </div>
            <button onClick={() => setChatStarted(false)} className="text-xs font-bold text-gray-400 hover:text-bridge-coral">
              End Session
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-bridge-primary text-ink font-medium rounded-tr-none shadow-sm"
                      : "bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSend()}
                placeholder="Type your response..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-bridge-primary"
              />
              <button onClick={handleSend} className="bg-bridge-primary text-white p-4 rounded-xl hover:opacity-90 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <li key={item} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
