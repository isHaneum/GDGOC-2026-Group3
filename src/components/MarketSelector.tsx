'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentMarket, setMarket, MARKETS } from '@shared/market';

export default function MarketSelector() {
  const [current, setCurrent] = useState<string>('kr-jp');

  useEffect(() => {
    setCurrent(getCurrentMarket().id);
  }, []);

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      {Object.values(MARKETS).map((market) => (
        <button
          key={market.id}
          onClick={() => setMarket(market.id)}
          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
            current === market.id
              ? 'bg-white text-bridge-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {market.id === 'kr-jp' ? 'KR 🇰🇷 → JP 🇯🇵' : 'JP 🇯🇵 → KR 🇰🇷'}
        </button>
      ))}
    </div>
  );
}
