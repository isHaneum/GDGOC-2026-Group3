'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentMarket } from '@shared/market';
import Link from 'next/link';

export default function OnboardingRoleSelection() {
  const router = useRouter();
  const [market, setMarket] = useState(getCurrentMarket());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-bridge-primary/10 px-4 py-1 rounded-full text-xs font-black text-bridge-teal uppercase tracking-widest mb-4">
            <span>Destination Selected: {market.targetCountry}</span>
          </div>
          <h1 className="text-4xl font-black text-ink mb-4 tracking-tighter">How will you cross the bridge?</h1>
          <p className="text-gray-500 font-medium">Are you seeking a career or looking for cultural talent?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => router.push('/developer/register')}
            className="group bg-white p-10 rounded-3xl shadow-panel border-2 border-transparent hover:border-bridge-primary transition-all text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-bridge-primary/10 text-bridge-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-ink">I'm looking for work</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Build your invisible signals, practice with the AI coach, and find IT roles in {market.targetCountry}.
              </p>
              <span className="text-bridge-primary font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform">
                Begin Career Journey <span className="ml-2">&rarr;</span>
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-bridge-primary opacity-[0.03] rounded-full group-hover:opacity-[0.07] transition-opacity"></div>
          </button>

          <button 
            onClick={() => router.push('/employer/register')}
            className="group bg-white p-10 rounded-3xl shadow-panel border-2 border-transparent hover:border-bridge-coral transition-all text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-bridge-coral/10 text-bridge-coral rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-ink">I'm looking for talent</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Match with {market.sourceCountry} developers based on cultural resonance and verified soft skills.
              </p>
              <span className="text-bridge-coral font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform">
                Find Cultural Talent <span className="ml-2">&rarr;</span>
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-bridge-coral opacity-[0.03] rounded-full group-hover:opacity-[0.07] transition-opacity"></div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-bridge-primary transition-colors">
            &larr; Reselect Destination
          </Link>
        </div>
      </div>
    </div>
  );
}
