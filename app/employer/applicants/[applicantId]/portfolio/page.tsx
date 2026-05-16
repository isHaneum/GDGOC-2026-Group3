import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  formatApplicantLanguages,
  formatApplicantList,
  formatApplicantSalary,
  loadApplicantProfileById,
  formatRelocationLabel,
  formatVisaSupportLabel,
  formatWorkStyle
} from "@src/lib/applicantProfiles";
import { ResumeContextMappingPanel } from "@src/components/ResumeContextMappingPanel";

export const dynamic = "force-dynamic";

export default async function ApplicantProfilePage({
  params
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = await params;
  let applicant;

  try {
    applicant = await loadApplicantProfileById(applicantId);
  } catch (error) {
    return <ApplicantLoadUnavailable message={error instanceof Error ? error.message : "Unable to load applicant."} />;
  }

  if (!applicant) notFound();

  return (
    <div className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <Link
          href="/employer/applicants"
          className="inline-flex items-center rounded border border-gray-200 bg-white px-2.5 py-1.5 text-caption font-bold text-ink shadow-sm transition-colors hover:border-bridge-primary"
        >
          ← Back to applicants
        </Link>

        <header className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-h2 font-bold text-ink">{applicant.name}</h1>
              <div className="flex flex-wrap gap-1.5">
                {applicant.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded bg-bridge-primary/10 px-2 py-0.5 text-caption font-bold text-bridge-teal"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-body font-medium text-gray-500">
              {applicant.nationality} · {applicant.yearsOfExperience} years of experience
            </p>
          </div>
        </header>

        <ResumeContextMappingPanel applicant={applicant} />

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="flex flex-col gap-3 lg:col-span-1">
            <ProfileSection title="Core Tech Stack">
              <TagList values={applicant.availableTechStacks} />
            </ProfileSection>

            <ProfileSection title="Languages">
              <div className="flex flex-wrap gap-1.5">
                {formatApplicantLanguages(applicant).map((language) => (
                  <span key={language} className="rounded border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-medium text-gray-600">
                    {language}
                  </span>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection title="Work Preferences">
              <DefinitionList
                rows={[
                  ["Locations", formatApplicantList(applicant.preferredLocations)],
                  ["Work Style", formatWorkStyle(applicant.workStylePreference)],
                  ["Salary", formatApplicantSalary(applicant)],
                  ["Relocation", formatRelocationLabel(applicant)],
                  ["Visa", formatVisaSupportLabel(applicant)]
                ]}
              />
            </ProfileSection>

            <ProfileSection title="Concerns">
              <ul className="flex flex-col gap-1.5">
                {(applicant.concerns?.length ? applicant.concerns : ["Not specified"]).map((concern) => (
                  <li key={concern} className="rounded border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-caption text-orange-700">
                    {concern}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextSection title="Resume Overview" value={applicant.resumeText} />
              <TextSection title="Portfolio Details" value={applicant.portfolioText} />
            </div>
            <TextSection title="Motivation" value={applicant.motivation} />
            <TextSection title="GitHub" value={applicant.githubUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicantLoadUnavailable({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/employer/applicants"
          className="inline-flex items-center rounded border border-gray-200 bg-white px-2.5 py-1.5 text-caption font-bold text-ink shadow-sm transition-colors hover:border-bridge-primary"
        >
          ← Back to applicants
        </Link>
        <div className="mt-4 rounded-lg border border-bridge-coral/30 bg-white p-5 shadow-sm">
          <p className="text-body font-bold text-bridge-coral">지원자 데이터를 불러올 수 없습니다</p>
          <p className="mt-1 text-body text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm ${className || ''}`}>
      <h2 className="mb-2.5 text-caption font-bold uppercase tracking-wider text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

function TextSection({ title, value }: { title: string; value?: string }) {
  return (
    <ProfileSection title={title} className="h-full">
      <div className="text-body leading-relaxed text-gray-700 whitespace-pre-wrap">
        {value?.trim() || "Not specified"}
      </div>
    </ProfileSection>
  );
}

function TagList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(values.length ? values : ["Not specified"]).map((value) => (
        <span
          key={value}
          className="rounded border border-gray-100 bg-gray-50 px-2 py-1 text-caption font-medium text-gray-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function DefinitionList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <dt className="text-caption font-bold uppercase tracking-wider text-gray-400">{label}</dt>
          <dd className="text-caption font-medium text-gray-700 break-words mt-0.5">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
