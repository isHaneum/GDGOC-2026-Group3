import { getTranslations } from "next-intl/server";

import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function EmployerCompanyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employer" });

  return <InDevelopmentPage title={t("companyTitle")} backHref="/employer/postings" backLabel={t("postingsTitle")} locale={locale} />;
}
