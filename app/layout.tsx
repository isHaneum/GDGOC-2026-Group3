import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

import MarketSelector from "../src/components/MarketSelector";

export const metadata: Metadata = {
  title: "The Bridge | KR-JP Cultural IT Employment Platform",
  description: "A culture-first job board for junior developers moving between Korea and Japan.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bridge-paper text-ink antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-xl font-bold text-bridge-primary tracking-tighter">
              The Bridge
            </a>
            <div className="hidden md:flex space-x-6">
              <a href="/forums" className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">
                Community
              </a>
              <a href="/employer" className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">
                Applicants
              </a>
              <a href="/companies" className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">
                Hiring Companies
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/onboarding" className="text-sm font-bold text-gray-500 hover:text-bridge-primary transition-colors">
              Get Started
            </a>
            <MarketSelector />
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
