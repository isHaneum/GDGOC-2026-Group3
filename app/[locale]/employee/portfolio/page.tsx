import { getTranslations } from "next-intl/server";

import PortfolioForm from "@src/components/PortfolioForm";

export default async function EmployeePortfolioPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employee" });

  return (
    <PortfolioForm
      title={t("portfolioTitle")}
      description={t("portfolioDescription")}
    />
  );
}
