'use client';

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@i18n/navigation";
import { setMarket } from "@shared/market";
import { BridgeDirectionMap } from "./BridgeDirectionMap";
import type { BridgeDirectionId } from "./landingData";
import { bridgeDirections } from "./landingData";

export function BridgeLanding() {
  const t = useTranslations("home");
  const router = useRouter();
  const [hoveredDirection, setHoveredDirection] = useState<BridgeDirectionId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  function handleDirectionSelect(direction: BridgeDirectionId) {
    setMarket(direction);
    router.push("/signup/onboarding");
  }

  const selectedDirection = hoveredDirection ? bridgeDirections[hoveredDirection] : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper flex flex-col items-center justify-center px-4 overflow-hidden">
      <header className="text-center mb-6 relative z-10">
        <p className="text-caption font-black uppercase tracking-widest text-bridge-teal mb-2">
          {t("directionEyebrow")}
        </p>
        <h1 className="text-display1 font-black text-ink mb-3 tracking-tight">
          The <span className="text-bridge-primary">Bridge</span>
        </h1>
        <p className="text-body text-gray-500 font-medium max-w-md mx-auto">
          {t("directionDescription")}
        </p>
      </header>

      <BridgeDirectionMap
        hovered={hoveredDirection}
        onHover={setHoveredDirection}
        onSelect={handleDirectionSelect}
      />

      <footer className="mt-6 flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white/70 px-4 py-2 text-center shadow-sm border border-gray-100">
          <p className="text-caption font-black uppercase tracking-widest text-gray-400">
            {t("currentStatus")}
          </p>
          <p className="mt-0.5 text-caption font-bold text-ink">
            {selectedDirection ? `${selectedDirection.shortLabel} · ${t("continueRole")}` : t("chooseDirection")}
          </p>
        </div>

        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bridge-primary shadow-[0_0_8px_#10b981]" />
            <span className="text-caption font-bold text-gray-400 uppercase tracking-widest">{t("activeRegions")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-caption font-bold text-gray-400 uppercase tracking-widest">{t("comingSoon")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
