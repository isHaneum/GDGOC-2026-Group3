'use client';

import React, { useEffect, useState } from 'react';
import { MARKETS, getCurrentMarket } from '@shared/market';
import Link from 'next/link';

export default function DeveloperDashboard() {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const strongPoints = [
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
              Annyeong, <span className="text-bridge-primary">Ji-hun!</span>
            </h1>
            <p className="text-gray-500 text-lg">
              Your cultural resonance with the <span className="font-semibold text-bridge-teal">{market.targetCountry}</span> market is growing.
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-panel border border-gray-100 flex items-center space-x-4">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quality Credits</span>
              <span className="text-xl font-black text-bridge-primary">2 / 3</span>
            </div>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Refresh</span>
              <span className="text-xs font-bold text-gray-500">June 1st</span>
            </div>
          </div>
        </div>
        
        {/* Qualitative Signal Insight */}
        <div className="bg-bridge-primary/5 p-6 rounded-2xl border border-bridge-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-bridge-teal flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Market Perspective Insight
            </h3>
            <p className="text-gray-700 leading-relaxed italic">
              "Your recent contributions to the <span className="font-bold text-bridge-teal">#Workplace-Etiquette</span> forum show a deep understanding of {market.targetCountry}'s high-context communication. Recruiters in Tokyo often prioritize this 'invisible' empathy over raw technical scores."
            </p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-bridge-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Strong Point Tags */}
          <section>
            <h2 className="text-xl font-bold text-ink mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-bridge-primary rounded-full mr-3"></span>
              Your Strong Points
            </h2>
            <div className="flex flex-wrap gap-3">
              {strongPoints.map((point, i) => (
                <span key={i} className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform hover:scale-105 cursor-default ${point.color}`}>
                  {point.label}
                </span>
              ))}
              <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 border border-dashed border-gray-300">
                + Next signal emerging...
              </span>
            </div>
          </section>

          {/* Forum Activity */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink flex items-center">
                <span className="w-1.5 h-6 bg-bridge-teal rounded-full mr-3"></span>
                Cultural Engagement
              </h2>
              <Link href="/forums" className="text-bridge-primary font-semibold hover:underline text-sm">Open Forums &rarr;</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-bridge-primary transition-all group cursor-pointer shadow-panel">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-bridge-teal/10 text-bridge-teal text-[10px] font-black px-2 py-0.5 rounded uppercase">Nuance</span>
                  <span className="text-[10px] font-bold text-gray-300">Updated 2h ago</span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-bridge-primary">Code Review Etiquette</h3>
                <p className="text-gray-500 text-sm line-clamp-2">How to give constructive feedback in {market.targetCountry} without being 'too direct'.</p>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-bridge-primary transition-all group cursor-pointer shadow-panel">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-bridge-blue/10 text-bridge-blue text-[10px] font-black px-2 py-0.5 rounded uppercase">Growth</span>
                  <span className="text-[10px] font-bold text-gray-300">4 New Insights</span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-bridge-primary">Startup Trends 2026</h3>
                <p className="text-gray-500 text-sm line-clamp-2">The rise of Web3 and React Server Components in {market.targetCountry}'s startup scene.</p>
              </div>
            </div>
          </section>
        </div>
        
        {/* Side Column: AI Coach & Safety */}
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
                Test your cultural readiness in a safe space. Results are 100% private and won't affect your public profile.
              </p>
              <div className="flex items-center justify-between">
                <Link href="/developer/coach" className="bg-bridge-primary text-ink px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                  Start Practice
                </Link>
                <span className="text-xs font-bold text-bridge-primary/60 uppercase tracking-tighter">1 Session Left</span>
              </div>
            </div>
            {/* Decorative background flare */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-bridge-primary/10 rounded-full blur-2xl group-hover:bg-bridge-primary/20 transition-colors"></div>
          </section>

          <div className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Why "Invisible"?
            </h3>
            <p className="text-xs text-gray-500 leading-loose">
              We don't believe in numerical rankings. Your journey is unique. We analyze your forum activity and practice sessions to highlight your **qualitative strengths** to employers, ensuring you're matched for who you are, not just what you score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
