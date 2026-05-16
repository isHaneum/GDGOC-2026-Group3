import type { ExtractedHiringSignal, RawCareerSource } from "../../shared/types";
import { generateGeminiJson, hasGeminiKey } from "./gemini";
import { hiringSignalExtractionPrompt } from "./prompts";
import { extractedHiringSignalSchema } from "./schemas";

type Term = {
  label: string;
  pattern: RegExp;
};

const technicalTerms: Term[] = [
  { label: "React", pattern: /\breact\b/i },
  { label: "TypeScript", pattern: /\btypescript\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b/i },
  { label: "HTML", pattern: /\bhtml\b/i },
  { label: "CSS", pattern: /\bcss\b/i },
  { label: "Accessibility", pattern: /\baccessibility\b/i },
  { label: "REST API", pattern: /\brest api|api design|apis\b/i },
  { label: "Node.js", pattern: /\bnode\.?js\b/i },
  { label: "Java", pattern: /\bjava\b/i },
  { label: "SQL", pattern: /\bsql|database|schema\b/i },
  { label: "Cloud deployment", pattern: /\bcloud|deployment|deployed\b/i },
  { label: "Testing", pattern: /\btest|testing|coverage\b/i },
  { label: "Authentication", pattern: /\bauthentication|auth\b/i },
  { label: "Python", pattern: /\bpython\b/i },
  { label: "Data preprocessing", pattern: /\bdata preprocessing|dataset\b/i },
  { label: "Model evaluation", pattern: /\bmodel evaluation|metrics|overfitting\b/i },
  { label: "MLOps", pattern: /\bmlops|experiment tracking|deployment notes\b/i },
  { label: "PyTorch", pattern: /\bpytorch\b/i },
  { label: "TensorFlow", pattern: /\btensorflow\b/i },
  { label: "Computer vision", pattern: /\bcomputer vision|visual inspection\b/i },
  { label: "Network fundamentals", pattern: /\bnetwork\b/i },
  { label: "Linux", pattern: /\blinux\b/i },
  { label: "Log analysis", pattern: /\blog analysis|logs\b/i },
  { label: "Vulnerability triage", pattern: /\bvulnerabilit|owasp|triage\b/i },
  { label: "Cloud IAM", pattern: /\biam\b/i },
  { label: "Threat modeling", pattern: /\bthreat modeling\b/i }
];

const softSkillTerms: Term[] = [
  { label: "Clear progress reporting", pattern: /\bprogress|status report|reporting|daily standups?\b/i },
  { label: "Asking questions early", pattern: /\bask questions|blocked|unclear requirements\b/i },
  { label: "Team collaboration", pattern: /\bcollaborat|teamwork|teammates|designers|developers\b/i },
  { label: "Trade-off explanation", pattern: /\btrade-off|decision|explain\b/i },
  { label: "Careful incident communication", pattern: /\bincident|calm reporting|escalate\b/i },
  { label: "Documentation habit", pattern: /\bdocumentation|readme|notes|summaries\b/i },
  { label: "Honest skill boundaries", pattern: /\bhonest|boundaries|avoid overclaiming\b/i }
];

const companyValueTerms: Term[] = [
  { label: "Product impact", pattern: /\bproduct|business impact|users\b/i },
  { label: "Quality and reliability", pattern: /\bquality|reliability|careful|risk\b/i },
  { label: "Customer-facing clarity", pattern: /\bcustomer|client|stakeholders\b/i },
  { label: "Learning and improvement", pattern: /\blearning|improvement|habits\b/i },
  { label: "Respectful communication", pattern: /\bpolite|respectful\b/i }
];

function pickTerms(text: string, terms: Term[]): string[] {
  return terms.filter((term) => term.pattern.test(text)).map((term) => term.label);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function languageLevel(text: string): string {
  const jlpt = text.match(/JLPT\s*N[1-5]/i)?.[0];
  if (jlpt) return jlpt.toUpperCase();
  if (/japanese.*(reading|writing|communication|reports?|summaries|meeting)/i.test(text)) {
    return "Japanese workplace communication expected";
  }
  return "unknown";
}

function roleDefaults(role: string): string[] {
  const normalized = role.toLowerCase();
  if (normalized.includes("frontend")) return ["React", "TypeScript", "JavaScript"];
  if (normalized.includes("backend")) return ["REST API", "SQL", "Testing"];
  if (normalized.includes("machine") || normalized.includes("ai")) {
    return ["Python", "Model evaluation", "Data preprocessing"];
  }
  if (normalized.includes("security")) return ["Network fundamentals", "Linux", "Log analysis"];
  return [];
}

function questionDefaults(role: string): string[] {
  const normalized = role.toLowerCase();
  if (normalized.includes("frontend")) {
    return [
      "How do you report a UI bug?",
      "How do you handle unclear requirements?",
      "How did you collaborate with designers?"
    ];
  }
  if (normalized.includes("backend")) {
    return [
      "How do you design API error handling?",
      "What part of the system did you personally implement?",
      "How do you debug production-like issues?"
    ];
  }
  if (normalized.includes("machine") || normalized.includes("ai")) {
    return [
      "How do you evaluate model quality?",
      "How do you explain model limitations?",
      "How did the ML work connect to business impact?"
    ];
  }
  if (normalized.includes("security")) {
    return [
      "How do you prioritize vulnerabilities?",
      "How do you communicate incident risk?",
      "How do you document reproduction steps?"
    ];
  }
  return [
    "Please introduce yourself briefly.",
    "Why are you targeting Japan?",
    "What was your role in the project?"
  ];
}

export function fallbackExtractHiringSignal(source: RawCareerSource): ExtractedHiringSignal {
  const text = source.summaryText;
  const requiredTechnicalSkills = unique([
    ...pickTerms(text, technicalTerms).slice(0, 8),
    ...roleDefaults(source.role)
  ]).slice(0, 8);
  const softSkills = unique(pickTerms(text, softSkillTerms));
  const companyValues = unique(pickTerms(text, companyValueTerms));
  const recommendedEvidence = unique(
    [
      /github/i.test(text) ? "GitHub portfolio" : "",
      /readme/i.test(text) ? "Bilingual README" : "",
      /bug report|issue/i.test(text) ? "Japanese issue or bug report" : "",
      /pull request|code review/i.test(text) ? "Pull request or code review history" : "",
      /deployed|deployment/i.test(text) ? "Deployed project" : "",
      /notebook|experiment|metrics/i.test(text) ? "Reproducible experiment report" : "",
      /ctf|security report|vulnerability/i.test(text) ? "Security writeup or remediation ticket" : "",
      /team|collaboration/i.test(text) ? "Team collaboration log" : ""
    ].filter(Boolean)
  );

  const concerns = unique(
    [
      /vague|unclear/i.test(text) ? "Vague project ownership or motivation" : "",
      /motivation/i.test(text) ? "Motivation needs to be specific to role, product, or company" : "",
      /japanese|language/i.test(text) ? "Japanese workplace communication may need proof" : "",
      /overclaim|exaggerated/i.test(text) ? "Risk of overclaiming without evidence" : "",
      /team|collaboration/i.test(text) ? "Teamwork evidence may be checked" : ""
    ].filter(Boolean)
  );

  const commonWeaknesses = unique(
    [
      /only mentioning tutorials|tutorials/i.test(text) ? "Tutorial-only project explanation" : "",
      /no evidence|without readme|no monitoring|no explanation/i.test(text)
        ? "Missing concrete evidence"
        : "",
      /memorized|broad statements|liking japan/i.test(text)
        ? "Generic or memorized motivation"
        : ""
    ].filter(Boolean)
  );

  const successSignals = unique([
    ...recommendedEvidence,
    ...softSkills,
    ...companyValues
  ]).slice(0, 10);

  return {
    sourceId: source.id,
    role: source.role,
    requiredTechnicalSkills,
    preferredTechnicalSkills: pickTerms(text, technicalTerms).filter(
      (skill) => !requiredTechnicalSkills.includes(skill)
    ),
    requiredLanguageLevel: languageLevel(text),
    preferredSoftSkills: softSkills,
    companyValues,
    commonConcerns: concerns,
    commonInterviewQuestions: questionDefaults(source.role),
    successSignals,
    commonWeaknesses,
    recommendedEvidence,
    extractedSummary: text.length > 260 ? `${text.slice(0, 257)}...` : text
  };
}

function normalizeSignal(source: RawCareerSource, signal: ExtractedHiringSignal): ExtractedHiringSignal {
  return {
    sourceId: source.id,
    role: source.role,
    requiredTechnicalSkills: signal.requiredTechnicalSkills ?? [],
    preferredTechnicalSkills: signal.preferredTechnicalSkills ?? [],
    requiredLanguageLevel: signal.requiredLanguageLevel || "unknown",
    preferredSoftSkills: signal.preferredSoftSkills ?? [],
    companyValues: signal.companyValues ?? [],
    commonConcerns: signal.commonConcerns ?? [],
    commonInterviewQuestions: signal.commonInterviewQuestions ?? [],
    successSignals: signal.successSignals ?? [],
    commonWeaknesses: signal.commonWeaknesses ?? [],
    recommendedEvidence: signal.recommendedEvidence ?? [],
    extractedSummary: signal.extractedSummary || fallbackExtractHiringSignal(source).extractedSummary
  };
}

export async function extractHiringSignal(
  source: RawCareerSource,
  useGemini = true
): Promise<ExtractedHiringSignal> {
  if (useGemini && hasGeminiKey()) {
    try {
      const signal = await generateGeminiJson<ExtractedHiringSignal>({
        prompt: hiringSignalExtractionPrompt(source),
        schema: extractedHiringSignalSchema,
        temperature: 0.1
      });
      return normalizeSignal(source, signal);
    } catch (error) {
      console.warn(`Gemini extraction failed for ${source.id}; using fallback.`, error);
    }
  }
  return fallbackExtractHiringSignal(source);
}

export async function extractAllHiringSignals(
  sources: RawCareerSource[],
  useGemini = true
): Promise<ExtractedHiringSignal[]> {
  const signals: ExtractedHiringSignal[] = [];
  for (const source of sources) {
    signals.push(await extractHiringSignal(source, useGemini));
  }
  return signals;
}
