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
      <div className="text-center mb-10 relative z-10">
        <h1 className="text-6xl font-black text-ink mb-4 tracking-tighter">
          The <span className="text-bridge-primary">Bridge</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-lg mx-auto text-lg">
          Crossing the cultural divide in East Asian IT.
        </p>
      </div>

      <div className="relative w-full max-w-6xl aspect-[16/9] flex items-center justify-center scale-110">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full drop-shadow-sm"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Detailed East Asia Outlines */}
          <g className="stroke-gray-200" strokeWidth="1" opacity="0.4">
            <path d="M50 100 Q 150 80, 200 150 T 250 300 T 300 450" />
            <path d="M100 50 Q 300 30, 450 60" />
            <path d="M650 20 Q 700 40, 720 100" />
            <path d="M280 460 Q 300 480, 320 470" />
          </g>

          {/* South Korea (Upscaled Detailed Path) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('jp-kr')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('jp-kr')}
          >
            <path 
              d="M365 170 L395 170 L410 210 L400 250 L380 260 L360 240 L365 170 Z" 
              fill={hovered === 'jp-kr' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'jp-kr' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            <text x="340" y="290" className={`text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${hovered === 'jp-kr' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              South Korea
            </text>
          </g>

          {/* Japan (Upscaled Detailed Paths) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('kr-jp')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('kr-jp')}
          >
            {/* Honshu */}
            <path 
              d="M540 180 L590 140 L670 120 L710 140 L670 200 L620 230 L570 230 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            {/* Kyushu / Shikoku */}
            <path 
              d="M510 240 L550 240 L540 280 L500 270 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            {/* Hokkaido */}
            <path 
              d="M680 60 L750 40 T 780 100 L730 130 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />
            <text x="640" y="260" className={`text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${hovered === 'kr-jp' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              Japan
            </text>
          </g>

          {/* The Bridge Path (Thicker and Larger) */}
          <path 
            id="bridge-path"
            d="M410 210 Q 475 150, 540 210" 
            stroke={hovered ? "#adebad" : "#f3f4f6"} 
            strokeWidth="5" 
            strokeDasharray="8 8"
            className="transition-colors duration-700"
          >
            {hovered === 'kr-jp' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="100" to="0" 
                dur="1.2s" 
                repeatCount="indefinite" 
              />
            )}
            {hovered === 'jp-kr' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="0" to="100" 
                dur="1.2s" 
                repeatCount="indefinite" 
              />
            )}
          </path>
        </svg>

        {/* Contextual Information - Fade In & Larger */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[180%] w-full max-w-md text-center transition-all duration-700 ease-in-out ${hovered ? 'opacity-100 translate-y-[-210%]' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white/90 backdrop-blur-lg px-8 py-6 rounded-3xl shadow-panel border border-bridge-primary/20">
            <h3 className="text-bridge-teal font-black text-sm uppercase tracking-widest mb-3">
              {hovered === 'kr-jp' ? 'South Korea 🇰🇷 → Japan 🇯🇵' : 'Japan 🇯🇵 → South Korea 🇰🇷'}
            </h3>
            <p className="text-gray-600 text-[13px] leading-relaxed font-medium">
              {hovered === 'kr-jp' 
                ? 'Join the Japanese IT ecosystem with a focus on high-context technical communication and UI refinement.' 
                : 'Enter the fast-paced Korean startup scene, leveraging agility and cross-cultural technical leadership.'}
            </p>
            <div className="mt-5 text-xs font-black text-bridge-primary animate-pulse">
              Click to cross the bridge &rarr;
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-bridge-primary shadow-[0_0_12px_#adebad]"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Corridors</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Future Markets</span>
          </div>
        </div>
      </div>
    </div>
  );
}
