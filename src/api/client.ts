import type {
  DeveloperProfile,
  ExtractedHiringSignal,
  GapAnalysisResult,
  RawCareerSource,
  RecruiterLensResult,
  ResumeContextMappingRequest,
  ResumeContextMappingResult,
  RoleBaseline
} from "../../shared/types";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function loadSampleData() {
  return fetchJson<{ sources: RawCareerSource[] }>("/api/load-sample-data", {
    method: "POST"
  });
}

export function getSources() {
  return fetchJson<{ sources: RawCareerSource[] }>("/api/sources");
}

export function getSignals() {
  return fetchJson<{ signals: ExtractedHiringSignal[] }>("/api/signals");
}

export function getBaselines() {
  return fetchJson<{ baselines: RoleBaseline[] }>("/api/baselines");
}

export function extractSignals() {
  return fetchJson<{ signals: ExtractedHiringSignal[] }>("/api/extract-signals", {
    method: "POST",
    body: JSON.stringify({ useGemini: true })
  });
}

export function buildBaseline() {
  return fetchJson<{ baselines: RoleBaseline[] }>("/api/build-baseline", {
    method: "POST"
  });
}

export function analyzeProfile(profile: DeveloperProfile) {
  return fetchJson<{ result: GapAnalysisResult; baseline: RoleBaseline }>("/api/analyze-profile", {
    method: "POST",
    body: JSON.stringify(profile)
  });
}

export function refactorIntroduction(profile: DeveloperProfile) {
  return fetchJson<{ result: RecruiterLensResult; baseline: RoleBaseline }>(
    "/api/refactor-introduction",
    {
      method: "POST",
      body: JSON.stringify(profile)
    }
  );
}

export function mapResumeContext(request: ResumeContextMappingRequest) {
  return fetchJson<ResumeContextMappingResult>("/api/map-resume-context", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
