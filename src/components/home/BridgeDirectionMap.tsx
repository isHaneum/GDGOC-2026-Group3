"use client";

import { useTranslations } from "next-intl";

import type { BridgeDirectionId } from "./landingData";

export function BridgeDirectionMap({
  hovered,
  onHover,
  onSelect
}: {
  hovered: BridgeDirectionId | null;
  onHover: (direction: BridgeDirectionId | null) => void;
  onSelect: (direction: BridgeDirectionId) => void;
}) {
  const t = useTranslations("home");

  return (
    <div className="relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center">
      <svg
        viewBox="250 30 800 400"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Detailed East Asia Outlines (Simplified for SVG paths) */}
        <g className="stroke-gray-300" strokeWidth="1.5" opacity="1">
          {/* Mainland China / East Asia Coastline */}
          {/* <path d="M50 100 Q 150 80, 200 150 T 250 300 T 300 450" />
          <path d="M100 50 Q 300 30, 450 60" /> */}
          {/* Sakhalin / North */}
          {/* <path d="M650 20 Q 700 40, 720 100" /> */}
          {/* Taiwan Area */}
          {/* <path d="M280 460 Q 300 480, 320 470" /> */}
        </g>

        {/* South Korea (Detailed Path) */}
        <g
          className="cursor-pointer group"
          onMouseEnter={() => onHover("jp-kr")}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect("jp-kr")}
        >
          <path
            d="M385 185 L405 185 L415 210 L410 240 L395 245 L380 230 L385 185 Z"
            fill={hovered === "jp-kr" ? "#adebad" : "#ffffff"}
            stroke={hovered === "jp-kr" ? "#adebad" : "#d1d5db"}
            strokeWidth="1.5"
            className="transition-all duration-500 ease-out"
          />
          <text
            x="360"
            y="265"
            className={`text-caption font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              hovered === "jp-kr" ? "fill-bridge-teal opacity-100" : "fill-gray-400 opacity-100"
            }`}
          >
            South Korea
          </text>
        </g>

        {/* Japan (Detailed Path - Honshu, Kyushu, Hokkaido stylized) */}
        <g
          className="cursor-pointer group"
          onMouseEnter={() => onHover("kr-jp")}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect("kr-jp")}
        >
          {/* Honshu */}
          <path
            d="M520 190 L560 160 L620 140 L650 160 L620 200 L580 230 L540 230 Z"
            fill={hovered === "kr-jp" ? "#adebad" : "#ffffff"}
            stroke={hovered === "kr-jp" ? "#adebad" : "#d1d5db"}
            strokeWidth="1.5"
            className="transition-all duration-500 ease-out"
          />
          {/* Kyushu / Shikoku stylized */}
          <path
            d="M500 240 L530 240 L520 270 L490 260 Z"
            fill={hovered === "kr-jp" ? "#adebad" : "#ffffff"}
            stroke={hovered === "kr-jp" ? "#adebad" : "#d1d5db"}
            strokeWidth="1.5"
            className="transition-all duration-500 ease-out"
          />
          {/* Hokkaido stylized */}
          <path
            d="M660 80 L720 60 L740 100 L700 130 Z"
            fill={hovered === "kr-jp" ? "#adebad" : "#ffffff"}
            stroke={hovered === "kr-jp" ? "#adebad" : "#d1d5db"}
            strokeWidth="1.5"
            className="transition-all duration-500 ease-out"
          />
          <text
            x="620"
            y="250"
            className={`text-caption font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              hovered === "kr-jp" ? "fill-bridge-teal opacity-100" : "fill-gray-400 opacity-100"
            }`}
          >
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
          {hovered === "kr-jp" && (
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
          )}
          {hovered === "jp-kr" && (
            <animate attributeName="stroke-dashoffset" from="0" to="100" dur="1.5s" repeatCount="indefinite" />
          )}
        </path>
      </svg>

      {/* Contextual Information - Fade In */}
      <div
        className={`absolute bottom-[8%] left-1/3 -translate-x-1/2 w-full max-w-sm text-center transition-all duration-500 ease-in-out ${
          hovered ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
        }`}
      >
        <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-panel border border-bridge-primary/20">
          <h3 className="text-bridge-teal font-black text-caption uppercase tracking-widest mb-2">
            {hovered === "kr-jp" ? "South Korea 🇰🇷 → Japan 🇯🇵" : "Japan 🇯🇵 → South Korea 🇰🇷"}
          </h3>
          <p className="text-gray-600 text-body font-medium leading-relaxed">
            {hovered === "kr-jp" ? t("bridgeToJapan") : t("bridgeToKorea")}
          </p>
          <div className="mt-4 text-body font-bold text-bridge-primary">
            {t("selectRoleCta")} &rarr;
          </div>
        </div>
      </div>
    </div>
  );
}
