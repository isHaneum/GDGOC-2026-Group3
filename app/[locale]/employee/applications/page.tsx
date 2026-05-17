import { getTranslations } from "next-intl/server";

import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function EmployeeApplicationsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employee" });

  return <InDevelopmentPage title={t("applicationsTitle")} backHref="/employee/companies" backLabel={t("backCompanies")} locale={locale} />;
}
