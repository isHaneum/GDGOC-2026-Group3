import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "../src/index.css";

import RoleAwareNav from "../src/components/RoleAwareNav";

export const metadata: Metadata = {
  title: "Bridge IT | KR-JP IT Talent Signal Platform",
  description: "A role-aware matching platform for hiring companies and developers moving between Korea and Japan.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bridge-paper text-ink antialiased">
        <Suspense fallback={null}>
          <RoleAwareNav />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}
