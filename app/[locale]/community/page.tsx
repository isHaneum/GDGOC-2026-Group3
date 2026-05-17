import { redirect } from "next/navigation";

export default async function CommunityPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/community/posts`);
}
