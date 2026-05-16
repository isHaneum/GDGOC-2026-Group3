'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentMarket } from '@shared/market';
import Link from 'next/link';

export default function DeveloperRegistration() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [market, setMarket] = useState(getCurrentMarket());

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    techStack: '',
    introduction: ''
  });

  useEffect(() => {
    setMounted(true);
    setMarket(getCurrentMarket());
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save the data here.
    // For now, we just redirect to the dashboard.
    router.push('/developer');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-panel border border-gray-100 overflow-hidden">
          <div className="bg-bridge-primary p-8 text-ink">
            <h1 className="text-3xl font-black tracking-tighter mb-2">Join the Bridge</h1>
            <p className="font-medium opacity-80">Start your journey from {market.sourceCountry} to {market.targetCountry}.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                required
                type="text" 
                placeholder="Ji-hun Kim"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-primary focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="jihun@bridgepass.com"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-primary focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Primary Tech Stack</label>
              <input 
                required
                type="text" 
                placeholder="React, TypeScript, Node.js"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-primary focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink"
                value={formData.techStack}
                onChange={(e) => setFormData({...formData, techStack: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Self-Introduction (The "Bridge" Signal)</label>
              <textarea 
                required
                rows={4}
                placeholder="Explain your interest in the Japanese market and your technical background..."
                className="w-full bg-gray-50 border-2 border-transparent focus:border-bridge-primary focus:bg-white rounded-2xl px-5 py-4 transition-all outline-none font-medium text-ink resize-none"
                value={formData.introduction}
                onChange={(e) => setFormData({...formData, introduction: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed px-1">
                Tip: Our AI Signal Engine looks for communication clarity and cultural resonance. This introduction is your first "Invisible Signal".
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-ink text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-bridge-teal transition-all flex items-center justify-center group"
            >
              Complete Registration
              <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/onboarding" className="text-xs font-bold text-gray-400 hover:text-bridge-primary transition-colors">
            &larr; Back to Role Selection
          </Link>
        </div>
      </div>
    </div>
  );
}
