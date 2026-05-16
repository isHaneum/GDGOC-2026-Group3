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
  return role === "developer" ? "/developer" : "/employer";
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
            역할을 먼저 선택하면 이후 화면은 해당 역할의 추천, 관리, 작성 흐름만 보여줍니다.
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
            <p className="text-xs font-black uppercase tracking-widest text-bridge-teal">Developer</p>
            <h2 className="mt-3 text-2xl font-black text-ink">개발자</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              기업별 구인정보를 보고 추천 직무를 확인한 뒤 자기소개서를 다듬습니다.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-sm font-bold text-ink">
              개발자로 시작
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            className="group rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-bridge-coral"
          >
            <p className="text-xs font-black uppercase tracking-widest text-bridge-coral">Hiring Company</p>
            <h2 className="mt-3 text-2xl font-black text-ink">기업 담당자</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              추천 개발자를 보고 지원자 흐름과 기업/직무 조건을 관리합니다.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
              기업으로 시작
            </span>
          </button>
        </div>

        <Link href="/" className="mt-8 text-sm font-bold text-gray-400 hover:text-bridge-primary">
          시장 방향 다시 선택
        </Link>
      </div>
    </div>
  );
}
