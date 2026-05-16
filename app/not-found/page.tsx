import Link from "next/link";

export default function NotFoundRoutePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
      <section className="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-6 text-center shadow-panel">
        <p className="text-caption font-black uppercase tracking-widest text-bridge-coral">404</p>
        <h1 className="mt-3 text-h1 font-black text-ink">Page not found</h1>
        <p className="mt-3 text-body leading-6 text-gray-500">
          요청한 페이지를 찾을 수 없습니다.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-flex rounded-full bg-bridge-primary px-4 py-2 text-body font-black text-white"
        >
          Go to main
        </Link>
      </section>
    </main>
  );
}

