'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setMarket } from "@shared/market";
import { BridgeDirectionMap } from "./BridgeDirectionMap";
import type { BridgeDirectionId } from "./landingData";
import { bridgeDirections } from "./landingData";

export function BridgeLanding() {
  const router = useRouter();
  const [hoveredDirection, setHoveredDirection] = useState<BridgeDirectionId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  function handleDirectionSelect(direction: BridgeDirectionId) {
    setMarket(direction);
    router.push("/onboarding");
  }

  const selectedDirection = hoveredDirection ? bridgeDirections[hoveredDirection] : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex flex-col items-center justify-center px-4 overflow-hidden">
      <header className="text-center mb-10 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-bridge-teal mb-3">
          Select corridor
        </p>
        <h1 className="text-5xl font-black text-ink mb-4 tracking-tight">
          The <span className="text-bridge-primary">Bridge</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl mx-auto">
          Select the market direction on the map, then choose whether to continue as a developer or employer.
        </p>
      </header>

      <BridgeDirectionMap
        hovered={hoveredDirection}
        onHover={setHoveredDirection}
        onSelect={handleDirectionSelect}
      />

      <footer className="mt-8 flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-white/70 px-5 py-3 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Current action
          </p>
          <p className="mt-1 text-sm font-bold text-ink">
            {selectedDirection ? `${selectedDirection.shortLabel} · Continue to onboarding` : "Choose a direction"}
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-bridge-primary shadow-[0_0_8px_#adebad]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Corridors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Future Markets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
