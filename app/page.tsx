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
    router.push('/developer');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-5xl font-black text-ink mb-4 tracking-tighter">
          The <span className="text-bridge-primary">Bridge</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-md mx-auto">
          Crossing the cultural divide in East Asian IT.
        </p>
      </div>

      <div className="relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full drop-shadow-sm"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Detailed East Asia Outlines (Simplified for SVG paths) */}
          <g className="stroke-gray-200" strokeWidth="1" opacity="0.5">
            {/* Mainland China / East Asia Coastline */}
            <path d="M50 100 Q 150 80, 200 150 T 250 300 T 300 450" />
            <path d="M100 50 Q 300 30, 450 60" />
            {/* Sakhalin / North */}
            <path d="M650 20 Q 700 40, 720 100" />
            {/* Taiwan Area */}
            <path d="M280 460 Q 300 480, 320 470" />
          </g>

          {/* South Korea (Detailed Path) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('jp-kr')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('jp-kr')}
          >
            <path 
              d="M385 185 L405 185 L415 210 L410 240 L395 245 L380 230 L385 185 Z" 
              fill={hovered === 'jp-kr' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'jp-kr' ? "#adebad" : "#d1d5db"}
              strokeWidth="1.5"
              className="transition-all duration-500 ease-out"
            />
            <text x="360" y="265" className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${hovered === 'jp-kr' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              South Korea
            </text>
          </g>

          {/* Japan (Detailed Path - Honshu, Kyushu, Hokkaido stylized) */}
          <g 
            className="cursor-pointer group"
            onMouseEnter={() => setHovered('kr-jp')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelection('kr-jp')}
          >
            {/* Honshu */}
            <path 
              d="M520 190 L560 160 L620 140 L650 160 L620 200 L580 230 L540 230 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="1.5"
              className="transition-all duration-500 ease-out"
            />
            {/* Kyushu / Shikoku stylized */}
            <path 
              d="M500 240 L530 240 L520 270 L490 260 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="1.5"
              className="transition-all duration-500 ease-out"
            />
            {/* Hokkaido stylized */}
            <path 
              d="M660 80 L720 60 L740 100 L700 130 Z" 
              fill={hovered === 'kr-jp' ? "#adebad" : "#ffffff"}
              stroke={hovered === 'kr-jp' ? "#adebad" : "#d1d5db"}
              strokeWidth="1.5"
              className="transition-all duration-500 ease-out"
            />
            <text x="620" y="250" className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${hovered === 'kr-jp' ? 'fill-bridge-teal opacity-100' : 'fill-gray-300 opacity-60'}`}>
              Japan
            </text>
          </g>

          {/* The Bridge Path */}
          <path 
            id="bridge-path"
            d="M420 215 Q 470 170, 520 215" 
            stroke={hovered ? "#adebad" : "#f3f4f6"} 
            strokeWidth="3" 
            strokeDasharray="6 6"
            className="transition-colors duration-700"
          >
            {hovered === 'kr-jp' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="100" to="0" 
                dur="1.5s" 
                repeatCount="indefinite" 
              />
            )}
            {hovered === 'jp-kr' && (
              <animate 
                attributeName="stroke-dashoffset" 
                from="0" to="100" 
                dur="1.5s" 
                repeatCount="indefinite" 
              />
            )}
          </path>
        </svg>

        {/* Contextual Information - Fade In */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[180%] w-full max-w-sm text-center transition-all duration-700 ease-in-out ${hovered ? 'opacity-100 translate-y-[-200%]' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-panel border border-bridge-primary/10">
            <h3 className="text-bridge-teal font-black text-xs uppercase tracking-widest mb-2">
              {hovered === 'kr-jp' ? 'Seoul 🇰🇷 → Tokyo 🇯🇵' : 'Tokyo 🇯🇵 → Seoul 🇰🇷'}
            </h3>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              {hovered === 'kr-jp' 
                ? 'Join the Japanese IT ecosystem with a focus on high-context technical communication and UI refinement.' 
                : 'Enter the fast-paced Korean startup scene, leveraging agility and cross-cultural technical leadership.'}
            </p>
            <div className="mt-4 text-[10px] font-bold text-bridge-primary">
              Click to cross the bridge &rarr;
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-bridge-primary shadow-[0_0_8px_#adebad]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Corridors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Future Markets</span>
          </div>
        </div>
      </div>
    </div>
  );
}
