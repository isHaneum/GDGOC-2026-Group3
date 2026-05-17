import { getTranslations } from "next-intl/server";

import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function SignupCompanyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signup" });
  const employer = await getTranslations({ locale, namespace: "employer" });

  return <InDevelopmentPage title={t("companyTitle")} backHref="/employer/postings" backLabel={employer("postingsTitle")} locale={locale} />;
}
