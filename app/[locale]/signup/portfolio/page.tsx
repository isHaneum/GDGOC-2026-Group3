import { getTranslations } from "next-intl/server";

import PortfolioForm from "@src/components/PortfolioForm";

export default async function SignupPortfolioPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signup" });

  return (
    <PortfolioForm
      title={t("portfolioTitle")}
      description={t("portfolioDescription")}
    />
  );
}
