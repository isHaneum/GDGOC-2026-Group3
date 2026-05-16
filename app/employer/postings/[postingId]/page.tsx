import InDevelopmentPage from "@src/components/InDevelopmentPage";

export default async function EmployerPostingDetailPage({
  params
}: {
  params: Promise<{ postingId: string }>;
}) {
  const { postingId } = await params;

  return (
    <InDevelopmentPage
      title={`채용 공고 상세: ${postingId}`}
      backHref="/employer/postings"
      backLabel="Go to postings"
    />
  );
}

