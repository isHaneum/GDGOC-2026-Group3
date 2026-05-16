export interface MarketConfig {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  languages: string[];
  branding: {
    name: string;
    logo?: string;
    primaryColor: string;
  };
  features: {
    forum: boolean;
    aiAnalysis: boolean;
    invisibleScoring: boolean;
  };
}

export const MARKETS: Record<string, MarketConfig> = {
  "kr-jp": {
    id: "kr-jp",
    sourceCountry: "South Korea",
    targetCountry: "Japan",
    languages: ["ko", "ja", "en"],
    branding: {
      name: "The Bridge",
      primaryColor: "#adebad",
    },
    features: {
      forum: true,
      aiAnalysis: true,
      invisibleScoring: true,
    },
  },
  "jp-kr": {
    id: "jp-kr",
    sourceCountry: "Japan",
    targetCountry: "South Korea",
    languages: ["ja", "ko", "en"],
    branding: {
      name: "The Bridge",
      primaryColor: "#adebad",
    },
    features: {
      forum: true,
      aiAnalysis: true,
      invisibleScoring: true,
    },
  },
};

export const getCurrentMarket = () => {
  // In a real app, this might come from a hostname, cookie, or URL param
  // For the hackathon, we can default to 'kr-jp' but allow easy switching
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bridge_market');
    if (saved && MARKETS[saved]) return MARKETS[saved];
  }
  return MARKETS["kr-jp"];
};

export const setMarket = (id: string) => {
  if (MARKETS[id] && typeof window !== 'undefined') {
    localStorage.setItem('bridge_market', id);
    window.location.reload();
  }
};
