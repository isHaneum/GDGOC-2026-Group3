import { getTranslations } from "next-intl/server";

import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function EmployerPostingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employer" });

  return <InDevelopmentPage title={t("postingsTitle")} backHref="/employer/applicants" backLabel={t("backApplicants")} locale={locale} />;
}
