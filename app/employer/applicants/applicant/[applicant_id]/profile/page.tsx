import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { DeveloperPreference } from "@shared/companyCriteriaTypes";
import {
  findApplicantById,
  formatApplicantLanguages,
  formatApplicantList,
  formatApplicantSalary,
  formatRelocationLabel,
  formatVisaSupportLabel,
  formatWorkStyle
} from "@src/lib/applicantProfiles";
import sampleDeveloperProfiles from "../../../../../../public/data/company-criteria/sampleDeveloperProfiles.json";

const applicants = sampleDeveloperProfiles as DeveloperPreference[];

export function generateStaticParams() {
  return applicants.map((applicant) => ({
    applicant_id: applicant.developerId
  }));
}

export default async function ApplicantProfilePage({
  params
}: {
  params: Promise<{ applicant_id: string }>;
}) {
  const { applicant_id: applicantId } = await params;
  const applicant = findApplicantById(applicants, applicantId);

  if (!applicant) notFound();

  return (
    <div className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-6xl px-4 py-5">
        <Link
          href="/employer"
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition-colors hover:border-bridge-primary"
        >
          Back to applicants
        </Link>

        <header className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-panel">
          <p className="text-[10px] font-black uppercase tracking-widest text-bridge-teal">
            Applicant Profile
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-ink">{applicant.name}</h1>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {formatApplicantList(applicant.targetRoles)} · {applicant.nationality} ·{" "}
                {applicant.yearsOfExperience} years of experience
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {applicant.targetRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-bridge-primary/10 px-3 py-1 text-xs font-black text-bridge-teal"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-xl border border-bridge-primary/20 bg-bridge-primary/5 p-4">
          <p className="text-sm font-bold text-bridge-teal">Company-specific evaluation pending</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Candidate evaluation and resume context mapping require a later company matching context.
          </p>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ProfileSection title="Core Tech Stack">
            <TagList values={applicant.availableTechStacks} />
          </ProfileSection>

          <ProfileSection title="Language Certifications">
            <ul className="space-y-1.5">
              {formatApplicantLanguages(applicant).map((language) => (
                <li key={language} className="text-xs font-medium text-gray-600">
                  {language}
                </li>
              ))}
            </ul>
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
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TextSection title="Resume Text" value={applicant.resumeText} />
          <TextSection title="Portfolio Text" value={applicant.portfolioText} />
          <TextSection title="Motivation" value={applicant.motivation} />
          <ProfileSection title="Concerns">
            <ul className="space-y-1.5">
              {(applicant.concerns?.length ? applicant.concerns : ["Not specified"]).map((concern) => (
                <li key={concern} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  {concern}
                </li>
              ))}
            </ul>
          </ProfileSection>
        </section>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-panel">
      <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

function TextSection({ title, value }: { title: string; value?: string }) {
  return (
    <ProfileSection title={title}>
      <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
        {value?.trim() || "Not specified"}
      </p>
    </ProfileSection>
  );
}

function TagList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(values.length ? values : ["Not specified"]).map((value) => (
        <span
          key={value}
          className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function DefinitionList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-2.5">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</dt>
          <dd className="mt-0.5 text-xs font-medium text-gray-600">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
