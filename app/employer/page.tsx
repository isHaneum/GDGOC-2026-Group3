'use client';

import React, { useEffect, useState } from 'react';
import { MARKETS, getCurrentMarket } from '@shared/market';

export default function EmployerDashboard() {
  const [market, setMarket] = useState(MARKETS["kr-jp"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const candidates = [
    {
      name: "Kim Ji-hun",
      highlight: "Technical Keigo Expert",
      tags: ["N1 Japanese", "React Native", "Keigo Mastery"],
      matchReason: "Frequent contributor to cultural etiquette forums. Shows high empathy for Japanese workplace communication.",
      status: "High Relevance"
    },
    {
      name: "Park Seo-yeon",
      highlight: "Cross-Border UX Specialist",
      tags: ["Figma", "Japanese UI Design", "Bilingual"],
      matchReason: "Actively engaged in JP-KR design localization threads. Understands the visual nuances of the Japanese market.",
      status: "Recommended"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Employer Matchmaker</h1>
          <p className="text-gray-500">Finding {market.sourceCountry} developers with deep {market.targetCountry} resonance.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-bridge-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Pool
          </button>
          <div className="bg-bridge-primary/10 px-3 py-1 rounded-full flex items-center">
            <span className="text-[10px] font-black text-bridge-teal uppercase tracking-tighter">15 Credits Left</span>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Qualitative Filters</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-3">Cultural Strong Point</label>
                <div className="space-y-2">
                  {["Keigo Proficiency", "UI Localization", "Workplace Etiquette", "Team Harmony"].map((filter) => (
                    <label key={filter} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-bridge-primary focus:ring-bridge-primary" />
                      <span className="ml-3 text-sm text-gray-600 group-hover:text-bridge-primary transition-colors">{filter}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-bold text-ink mb-3">Language Focus</label>
                <select className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-bridge-primary">
                  <option>N1 (Native / Fluent)</option>
                  <option>N2 (Business)</option>
                  <option>N3 (Conversational)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-bridge-primary/5 p-6 rounded-2xl border border-bridge-primary/20">
            <h3 className="text-sm font-bold text-bridge-teal mb-2">Quality Guarantee</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              We discourage mass-scanning. Each "Refresh" costs credits to ensure you spend time deeply reviewing the cultural fit of each candidate.
            </p>
          </div>
        </aside>
        
        {/* Candidate List */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-ink">Relevant Matches</h2>
            <span className="text-sm text-gray-400 font-medium">Matching based on your Job Description</span>
          </div>
          
          <div className="space-y-4">
            {candidates.map((candidate, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-panel border border-gray-100 hover:border-bridge-primary transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold group-hover:text-bridge-primary transition-colors">{candidate.name}</h3>
                      <span className="bg-bridge-teal/10 text-bridge-teal text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                        {candidate.status}
                      </span>
                    </div>
                    <p className="text-bridge-teal font-bold text-sm mb-4">{candidate.highlight}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {candidate.tags.map(tag => (
                        <span key={tag} className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-600 leading-relaxed">
                      <span className="font-bold text-bridge-primary not-italic block mb-1">AI Relevance Insight:</span>
                      "{candidate.matchReason}"
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end md:w-32">
                    <button className="w-full bg-bridge-primary text-white py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm">
                      View Profile
                    </button>
                    <button className="w-full text-gray-400 hover:text-bridge-coral transition-colors text-xs font-bold py-2">
                      Save for Later
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center pt-8">
            <p className="text-gray-400 text-sm mb-4">Want more specialized matches?</p>
            <button className="text-bridge-primary font-bold hover:underline">Customize AI Search Parameters &rarr;</button>
          </div>
        </main>
      </div>
    </div>
  );
}
