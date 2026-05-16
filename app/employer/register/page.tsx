'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentMarket } from '@shared/market';
import Link from 'next/link';

export default function EmployerRegistration() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [market, setMarket] = useState(getCurrentMarket());

  const [formData, setFormData] = useState({
    companyName: '',
    recruiterName: '',
    email: '',
    industry: '',
    needReason: ''
  });

  useEffect(() => {
    setMounted(true);
    setMarket(getCurrentMarket());
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save the data here.
    router.push('/employer');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-panel border border-gray-100 overflow-hidden">
          <div className="bg-bridge-coral p-8 text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-2">Find Cultural Talent</h1>
            <p className="font-medium opacity-90">Start matching with {market.sourceCountry} developers who resonate with {market.targetCountry}.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="BridgeTech Inc."
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-coral focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="Sato Hanako"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-coral focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                  value={formData.recruiterName}
                  onChange={(e) => setFormData({...formData, recruiterName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
              <input 
                required
                type="email" 
                placeholder="h.sato@bridgetech.jp"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-coral focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Industry</label>
              <select 
                required
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-coral focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink appearance-none"
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              >
                <option value="" disabled>Select Industry</option>
                <option value="fintech">FinTech</option>
                <option value="saas">SaaS / Enterprise</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="gaming">Gaming</option>
                <option value="ai">AI / Data Science</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Why cross-border talent?</label>
              <textarea 
                required
                rows={4}
                placeholder="What specific cultural or technical strengths are you looking for in developers from {market.sourceCountry}?"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-coral focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink resize-none"
                value={formData.needReason}
                onChange={(e) => setFormData({...formData, needReason: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed px-1">
                Note: We use this to calibrate our Signal-First Matchmaker. We prioritize quality resonance over mass keyword matching.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-ink text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-bridge-coral transition-all flex items-center justify-center group"
            >
              Start Recruitment
              <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/onboarding" className="text-xs font-bold text-gray-400 hover:text-bridge-coral transition-colors">
            &larr; Back to Role Selection
          </Link>
        </div>
      </div>
    </div>
  );
}
