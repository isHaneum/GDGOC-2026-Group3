import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

import MarketSelector from "../src/components/MarketSelector";

export const metadata: Metadata = {
  title: "Bridge IT | KR-JP IT Talent Signal Platform",
  description: "A role-aware matching platform for hiring companies and developers moving between Korea and Japan.",
  icons: {
    icon: "/favicon.svg"
  }
};

const navItems = [
  { href: "/community", label: "Community" },
  { href: "/employer", label: "Applicants" },
  { href: "/companies", label: "Hiring Companies" },
  { href: "/signal-lab", label: "Signal Lab" },
  { href: "/apply", label: "Apply", title: "지원서 작성 / 応募書類作成" }
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bridge-paper text-ink antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-xl font-bold tracking-tighter" aria-label="Bridge IT home">
              <span className="text-bridge-primary">Bridge</span>
              <span className="text-ink"> IT</span>
            </a>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} title={item.title} className="hover:text-bridge-primary px-1 py-2 text-sm font-medium transition-colors">
                  {item.label}
                </a>
              ))}
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
