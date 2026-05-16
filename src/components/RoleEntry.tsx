'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentMarket } from "@shared/market";
import {
  type BridgeUserRole,
  readBridgeUserRole,
  writeBridgeUserRole
} from "@src/lib/roleStorage";

function roleDestination(role: BridgeUserRole) {
  return role === "developer" ? "/signup/profile" : "/signup/profile";
}

export default function RoleEntry() {
  const router = useRouter();
  const [market, setMarket] = useState(getCurrentMarket());
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMarket(getCurrentMarket());
    setStoredRole(readBridgeUserRole());
    setMounted(true);
  }, []);

  function selectRole(role: BridgeUserRole) {
    writeBridgeUserRole(role);
    router.push(roleDestination(role));
  }

  if (!mounted) return <div className="min-h-screen bg-bridge-paper" />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex rounded-full bg-bridge-primary/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-bridge-teal">
            {market.sourceCountry} to {market.targetCountry}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-ink">Bridge IT 시작하기</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            역할을 먼저 선택하면 가입과 이후 화면은 해당 역할의 흐름만 보여줍니다.
          </p>
          {storedRole ? (
            <button
              type="button"
              onClick={() => router.push(roleDestination(storedRole))}
              className="mt-5 rounded-full border border-bridge-primary bg-white px-4 py-2 text-sm font-bold text-bridge-teal hover:bg-bridge-primary/10"
            >
              저장된 역할로 계속하기
            </button>
          ) : null}
        </header>

        <div className="grid w-full gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRole("developer")}
            className="group rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-bridge-primary"
          >
            <p className="text-xs font-black uppercase tracking-widest text-bridge-teal">Applicant</p>
            <h2 className="mt-3 text-2xl font-black text-ink">지원자</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              기업 정보를 보고 포트폴리오를 정리한 뒤 지원 흐름으로 이동합니다.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-sm font-bold text-ink">
              지원자로 가입
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            className="group rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-bridge-coral"
          >
            <p className="text-xs font-black uppercase tracking-widest text-bridge-coral">Hiring Company</p>
            <h2 className="mt-3 text-2xl font-black text-ink">채용자</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              지원자 목록과 채용 공고 흐름을 중심으로 서비스를 이용합니다.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
              채용자로 가입
            </span>
          </button>
        </div>

        <Link href="/signin" className="mt-8 text-sm font-bold text-gray-400 hover:text-bridge-primary">
          로그인 화면으로 이동
        </Link>
      </div>
    </div>
  );
}
