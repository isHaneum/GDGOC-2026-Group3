import Link from "next/link";

export default function ForumsPlaceholderPage() {
  return (
    <main className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <Link href="/developer" className="text-sm font-bold text-gray-400 hover:text-bridge-primary">
          &larr; Back to Developer Dashboard
        </Link>

        <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-panel">
          <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">Placeholder Route</p>
          <h1 className="mt-3 text-4xl font-black text-ink">Cultural Forums</h1>
          <p className="mt-4 max-w-2xl text-gray-500 leading-relaxed">
            This route keeps the signal-first UI navigation intact while the forum experience is implemented. The
            current integration branch focuses on connecting the BE-AI modules to the developer, coach, and employer
            surfaces.
          </p>
        </section>
      </div>
    </main>
  );
}
