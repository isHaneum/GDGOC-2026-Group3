import { Link } from "@i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function InDevelopmentPage({
  title,
  backHref = "/signin",
  backLabel,
  locale
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  locale?: string;
}) {
  const t = locale
    ? await getTranslations({ locale, namespace: "common" })
    : await getTranslations("common");

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bridge-paper px-4 py-12">
      <section className="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-6 shadow-panel">
        <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
          {t("inDevelopment")}
        </p>
        <h1 className="mt-3 text-h1 font-black text-ink">{title}</h1>
        <p className="mt-3 text-body leading-6 text-gray-500">{t("inDevelopmentBody")}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-body font-bold text-white transition-colors hover:bg-black"
        >
          {backLabel ?? t("backToMain")}
        </Link>
      </section>
    </main>
  );
}
