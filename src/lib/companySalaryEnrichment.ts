import rawSalaryDataset from "../../docs/japan_it_companies_salary_enriched.json";
import type { CompanyJobProfile, CompanySalarySourceLink } from "../../shared/companyCriteriaTypes";

type RawSalaryDataset = {
  metadata?: {
    currency?: CompanyJobProfile["salaryCurrency"];
  };
  companies?: RawSalaryCompany[];
};

type RawSalaryCompany = {
  companyId: string;
  salary?: {
    currency?: CompanyJobProfile["salaryCurrency"];
    lastCheckedAt?: string;
    newGraduate?: {
      annualJpyMin?: number | null;
      annualJpyMax?: number | null;
      amountText?: string;
    };
    averageAnnualSalary?: {
      annualJpy?: number | null;
      amountText?: string;
    };
    averageTenureYears?: {
      years?: number | null;
    };
    dataQualityNotes?: string[];
  };
  sourceLinks?: Array<{
    label: string;
    url: string;
    supports?: string;
    reliability?: string;
  }>;
};

type CompanySalaryEnrichment = Pick<
  CompanyJobProfile,
  | "companyId"
  | "salaryNote"
  | "startingSalaryMin"
  | "startingSalaryMax"
  | "startingSalaryCurrency"
  | "startingSalaryNote"
  | "averageAnnualSalary"
  | "averageAnnualSalaryNote"
  | "averageTenureYears"
  | "salaryLastCheckedAt"
  | "salaryDataQualityNotes"
  | "salarySourceLinks"
>;

const salaryDataset = rawSalaryDataset as RawSalaryDataset;

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isPlaceholderSalaryText(value?: string | null): boolean {
  if (!value) return false;

  return [
    'exact salary is not verified',
    'confirmation needed',
    'use official new graduate or role-specific salary page if available'
  ].some((snippet) => value.toLowerCase().includes(snippet));
}

function buildSalaryNote(enrichment: CompanySalaryEnrichment, existingNote?: string): string | undefined {
  const notes = unique([
    existingNote ?? "",
    enrichment.averageAnnualSalaryNote ? `Average annual salary: ${enrichment.averageAnnualSalaryNote}` : "",
    typeof enrichment.averageTenureYears === "number" ? `Average tenure: ${enrichment.averageTenureYears} years` : ""
  ]);

  return notes.length ? notes.join(" ") : undefined;
}

function normalizeSalaryCompany(company: RawSalaryCompany): CompanySalaryEnrichment {
  const salary = company.salary ?? {};
  const newGraduate = salary.newGraduate ?? {};
  const averageAnnualSalary = salary.averageAnnualSalary ?? {};
  const averageTenureYears = salary.averageTenureYears ?? {};
  const salarySourceLinks: CompanySalarySourceLink[] = (company.sourceLinks ?? []).map((link) => ({
    label: link.label,
    url: link.url,
    supports: link.supports,
    reliability: link.reliability
  }));

  return {
    companyId: company.companyId,
    startingSalaryMin: newGraduate.annualJpyMin ?? null,
    startingSalaryMax: newGraduate.annualJpyMax ?? null,
    startingSalaryCurrency: salary.currency ?? salaryDataset.metadata?.currency ?? "JPY",
    startingSalaryNote: newGraduate.amountText,
    averageAnnualSalary: averageAnnualSalary.annualJpy ?? null,
    averageAnnualSalaryNote: averageAnnualSalary.amountText,
    averageTenureYears: typeof averageTenureYears.years === "number" ? averageTenureYears.years : null,
    salaryLastCheckedAt: salary.lastCheckedAt,
    salaryDataQualityNotes: salary.dataQualityNotes ?? [],
    salarySourceLinks
  };
}

const salaryEnrichmentByCompanyId = new Map(
  (salaryDataset.companies ?? []).map((company) => {
    const enrichment = normalizeSalaryCompany(company);
    return [company.companyId, enrichment] as const;
  })
);

export function mergeCompanySalaryData(profile: CompanyJobProfile): CompanyJobProfile {
  const enrichment = salaryEnrichmentByCompanyId.get(profile.companyId);
  if (!enrichment) return profile;

  const mergedSourceUrls = unique([
    ...(profile.sourceUrls ?? []),
    ...(enrichment.salarySourceLinks?.map((link) => link.url) ?? [])
  ]);
  const existingSalaryNote = isPlaceholderSalaryText(profile.salaryNote) ? undefined : profile.salaryNote;
  const existingStartingSalaryNote = isPlaceholderSalaryText(profile.startingSalaryNote)
    ? undefined
    : profile.startingSalaryNote;

  return {
    ...profile,
    startingSalaryMin: profile.startingSalaryMin ?? enrichment.startingSalaryMin,
    startingSalaryMax: profile.startingSalaryMax ?? enrichment.startingSalaryMax,
    startingSalaryCurrency: profile.startingSalaryCurrency ?? enrichment.startingSalaryCurrency,
    startingSalaryNote: existingStartingSalaryNote ?? enrichment.startingSalaryNote,
    averageAnnualSalary: profile.averageAnnualSalary ?? enrichment.averageAnnualSalary,
    averageAnnualSalaryNote: profile.averageAnnualSalaryNote ?? enrichment.averageAnnualSalaryNote,
    averageTenureYears: profile.averageTenureYears ?? enrichment.averageTenureYears,
    salaryLastCheckedAt: profile.salaryLastCheckedAt ?? enrichment.salaryLastCheckedAt,
    salaryDataQualityNotes: profile.salaryDataQualityNotes ?? enrichment.salaryDataQualityNotes,
    salarySourceLinks: profile.salarySourceLinks ?? enrichment.salarySourceLinks,
    salaryNote: buildSalaryNote(enrichment, existingSalaryNote),
    sourceUrls: mergedSourceUrls.length ? mergedSourceUrls : profile.sourceUrls
  };
}

export function mergeCompanySalaryDataList(profiles: CompanyJobProfile[]): CompanyJobProfile[] {
  return profiles.map(mergeCompanySalaryData);
}

export function getSalaryEnrichmentCompanyCount(): number {
  return salaryEnrichmentByCompanyId.size;
}