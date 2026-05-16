import type { DeveloperProfile, ExtractedHiringSignal, RoleBaseline } from "../../shared/types";
import { analyzeDeveloperProfile } from "./analyzer";
import { buildRoleBaselines } from "./baselineBuilder";
import { extractAllHiringSignals } from "./extractor";
import { refactorForRecruiterLens } from "./recruiterRefactorer";
import { loadSampleSources } from "./sampleData";
import { readJsonFile, writeJsonFile } from "./storage";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

async function loadSignals(): Promise<ExtractedHiringSignal[]> {
  return readJsonFile<ExtractedHiringSignal[]>("extractedSignals.json", []);
}

async function loadBaselines(): Promise<RoleBaseline[]> {
  return readJsonFile<RoleBaseline[]>("roleBaselines.json", []);
}

async function ensureSignals(): Promise<ExtractedHiringSignal[]> {
  const existing = await loadSignals();
  if (existing.length) return existing;
  const sources = await loadSampleSources();
  const signals = await extractAllHiringSignals(sources);
  await writeJsonFile("extractedSignals.json", signals);
  return signals;
}

async function ensureBaselines(): Promise<RoleBaseline[]> {
  const existing = await loadBaselines();
  if (existing.length) return existing;
  const sources = await loadSampleSources();
  const signals = await ensureSignals();
  const baselines = buildRoleBaselines(signals, sources);
  await writeJsonFile("roleBaselines.json", baselines);
  return baselines;
}

function findBaseline(baselines: RoleBaseline[], profile: DeveloperProfile): RoleBaseline | undefined {
  return (
    baselines.find(
      (baseline) =>
        baseline.role === profile.targetRole && baseline.country === profile.targetCountry
    ) ?? baselines.find((baseline) => baseline.role === profile.targetRole)
  );
}

export function getHealthPayload() {
  return { ok: true, service: "BridgePass Career Signal Engine" };
}

export async function getSampleSourcesPayload() {
  return { sources: await loadSampleSources() };
}

export async function getSignalsPayload() {
  return { signals: await loadSignals() };
}

export async function getBaselinesPayload() {
  return { baselines: await loadBaselines() };
}

export async function extractSignalsPayload(useGemini = true) {
  const sources = await loadSampleSources();
  const signals = await extractAllHiringSignals(sources, useGemini);
  await writeJsonFile("extractedSignals.json", signals);
  return { signals };
}

export async function buildBaselinePayload() {
  const sources = await loadSampleSources();
  const signals = await ensureSignals();
  const baselines = buildRoleBaselines(signals, sources);
  await writeJsonFile("roleBaselines.json", baselines);
  return { baselines };
}

export async function analyzeProfilePayload(profile: DeveloperProfile) {
  const baselines = await ensureBaselines();
  const baseline = findBaseline(baselines, profile);

  if (!baseline) {
    throw new ApiError(404, `No baseline found for ${profile.targetRole}. Build a baseline first.`);
  }

  const result = await analyzeDeveloperProfile(profile, baseline);
  return { result, baseline };
}

export async function refactorIntroductionPayload(profile: DeveloperProfile) {
  const baselines = await ensureBaselines();
  const baseline = findBaseline(baselines, profile);

  if (!baseline) {
    throw new ApiError(404, `No baseline found for ${profile.targetRole}. Build a baseline first.`);
  }

  const result = await refactorForRecruiterLens(profile, baseline);
  return { result, baseline };
}
