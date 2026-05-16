'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setMarket } from '@shared/market';

export default function InteractiveLanding() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  const handleSelection = (id: string) => {
    setMarket(id);
    router.push('/onboarding');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="text-center mb-14 relative z-10">
        <h1 className="text-6xl font-black text-ink mb-4 tracking-tighter">
          The <span className="text-bridge-primary">Bridge</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-lg mx-auto text-lg">
          Crossing the cultural divide in East Asian IT.
        </p>
      </div>

      <div className="relative w-full max-w-6xl aspect-[16/9] flex items-center justify-center scale-105">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full drop-shadow-sm"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* South Korea (Balanced Scale Path) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('jp-kr')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('jp-kr')}
          >
            <path 
              d="M375 180 L400 180 L410 210 L405 245 L390 250 L370 235 L375 180 Z" 
              fill={hovered === 'jp-kr' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'jp-kr' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            <text x="350" y="280" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${hovered === 'jp-kr' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              South Korea
            </text>
          </g>

          {/* Japan (Balanced Scale Paths) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('kr-jp')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('kr-jp')}
          >
            {/* Honshu */}
            <path 
              d="M530 185 L575 150 L645 130 L680 150 L645 195 L600 220 L555 220 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            {/* Kyushu / Shikoku */}
            <path 
              d="M505 240 L540 240 L530 275 L495 265 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            {/* Hokkaido */}
            <path 
              d="M670 70 L735 50 T 760 110 L715 130 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            <text x="630" y="250" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${hovered === 'kr-jp' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              Japan
            </text>
          </g>

          {/* The Bridge Path (Balanced Thickness) */}
          <path 
            id="bridge-path"
            d="M415 210 Q 470 160, 525 210" 
            stroke={hovered ? "#adebad" : "#f3f4f6"} 
            strokeWidth="4" 
            strokeDasharray="7 7"
            className="transition-colors duration-700"
          >
            {hovered === 'kr-jp' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="100" to="0" 
                dur="1.3s" 
                repeatCount="indefinite" 
              />
            )}
            {hovered === 'jp-kr' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="0" to="100" 
                dur="1.3s" 
                repeatCount="indefinite" 
              />
            )}
          </path>
        </svg>

        {/* Contextual Information - Refined Scale & Position */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[170%] w-full max-w-sm text-center transition-all duration-700 ease-in-out ${hovered ? 'opacity-100 translate-y-[-185%]' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white/95 backdrop-blur-md px-7 py-5 rounded-3xl shadow-panel border-2 border-bridge-primary/30">
            <h3 className="text-bridge-teal font-black text-xs uppercase tracking-widest mb-2.5">
              {hovered === 'kr-jp' ? 'South Korea 🇰🇷 → Japan 🇯🇵' : 'Japan 🇯🇵 → South Korea 🇰🇷'}
            </h3>
            <p className="text-gray-600 text-[12px] leading-relaxed font-medium">
              {hovered === 'kr-jp' 
                ? 'Join the Japanese IT ecosystem with a focus on high-context technical communication and UI refinement.' 
                : 'Enter the fast-paced Korean startup scene, leveraging agility and cross-cultural technical leadership.'}
            </p>
            <div className="mt-4 text-[11px] font-black text-bridge-primary animate-pulse">
              Click to cross the bridge &rarr;
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center space-x-7">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bridge-primary shadow-[0_0_10px_#adebad]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Corridors</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Future Markets</span>
          </div>
        </div>
      </div>
    </div>
  );
}
