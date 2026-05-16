import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

import MarketSelector from "../src/components/MarketSelector";

export const metadata: Metadata = {
  title: "The Bridge | KR-JP Cultural IT Employment Platform",
  description: "A culture-first job board for junior developers moving between Korea and Japan."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bridge-paper text-ink antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-xl font-bold text-bridge-primary tracking-tighter">The Bridge</a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-bold text-gray-500 hover:text-bridge-primary transition-colors">Login</button>
            <button className="bg-bridge-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Get Started</button>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
