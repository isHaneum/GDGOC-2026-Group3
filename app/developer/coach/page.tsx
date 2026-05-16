'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentMarket } from '@shared/market';
import Link from 'next/link';

export default function AICoachPage() {
  const [market, setMarket] = useState(getCurrentMarket());
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Welcome to your safe-practice environment. I'm your AI Coach. Today, I'll be acting as a Senior Engineering Manager from a Tokyo-based startup. Ready to begin our mock interview?" }
  ]);
  const [input, setInput] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    // Mock bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: "That's an interesting approach. In a Japanese context, how would you communicate this technical decision to a stakeholder who prefers high-context, consensus-based decision making?" }]);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <Link href="/developer" className="text-sm font-bold text-gray-400 hover:text-bridge-primary transition-colors flex items-center">
          &larr; Back to Dashboard
        </Link>
        <div className="bg-bridge-coral/10 text-bridge-coral px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          Safe Practice Zone
        </div>
      </div>

      {!chatStarted ? (
        <div className="bg-white p-10 rounded-3xl shadow-panel border border-gray-100 text-center">
          <div className="w-20 h-20 bg-bridge-primary/10 text-bridge-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-ink mb-4">Your Personal AI Coach</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Practice for your {market.targetCountry} interview in a risk-free environment. Learn cultural nuances, refine your technical Keigo, and get private feedback.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-teal">100%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Private</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-primary">Safe</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">No Profile Impact</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="block text-lg font-bold text-bridge-blue">Real</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Market Logic</span>
            </div>
          </div>

          <button 
            onClick={() => setChatStarted(true)}
            className="bg-ink text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-colors shadow-lg"
          >
            Start Practice Session
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-panel border border-gray-100 flex flex-col h-[600px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-bridge-primary rounded-full flex items-center justify-center font-bold text-ink">
                AC
              </div>
              <div>
                <h3 className="font-bold text-ink">AI Coach</h3>
                <p className="text-[10px] font-bold text-bridge-teal uppercase tracking-widest">Mock Interview: Senior EM</p>
              </div>
            </div>
            <button 
              onClick={() => setChatStarted(false)}
              className="text-xs font-bold text-gray-400 hover:text-bridge-coral"
            >
              End Session
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-bridge-primary text-ink font-medium rounded-tr-none shadow-sm' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex space-x-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your response..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-bridge-primary"
              />
              <button 
                onClick={handleSend}
                className="bg-bridge-primary text-white p-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
