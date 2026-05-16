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
        <nav className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-xl font-bold text-bridge-primary">The Bridge</a>
            <div className="hidden md:flex space-x-6">
              <a href="/developer" className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">Developer</a>
              <a href="/employer" className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">Employer</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
