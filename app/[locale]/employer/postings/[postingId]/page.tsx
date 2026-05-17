import { getTranslations } from "next-intl/server";

import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function EmployerPostingDetailPage({
  params
}: {
  params: Promise<{ locale: string; postingId: string }>;
}) {
  const { locale, postingId } = await params;
  const t = await getTranslations({ locale, namespace: "employer" });

  return (
    <InDevelopmentPage
      title={t("postingDetailTitle", { postingId })}
      backHref="/employer/postings"
      backLabel={t("postingsTitle")}
      locale={locale}
    />
  );
}
