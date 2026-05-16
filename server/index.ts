import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { DeveloperProfile, ExtractedHiringSignal, RoleBaseline } from "../shared/types";
import { analyzeDeveloperProfile } from "./services/analyzer";
import { buildRoleBaselines } from "./services/baselineBuilder";
import { extractAllHiringSignals } from "./services/extractor";
import { refactorForRecruiterLens } from "./services/recruiterRefactorer";
import { loadSampleSources } from "./services/sampleData";
import { readJsonFile, writeJsonFile } from "./services/storage";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "BridgePass Career Signal Engine" });
});

app.post("/api/load-sample-data", async (_request, response, next) => {
  try {
    const sources = await loadSampleSources();
    response.json({ sources });
  } catch (error) {
    next(error);
  }
});

app.get("/api/sources", async (_request, response, next) => {
  try {
    const sources = await loadSampleSources();
    response.json({ sources });
  } catch (error) {
    next(error);
  }
});

app.post("/api/extract-signals", async (request, response, next) => {
  try {
    const sources = await loadSampleSources();
    const useGemini = request.body?.useGemini !== false;
    const signals = await extractAllHiringSignals(sources, useGemini);
    await writeJsonFile("extractedSignals.json", signals);
    response.json({ signals });
  } catch (error) {
    next(error);
  }
});

app.get("/api/signals", async (_request, response, next) => {
  try {
    response.json({ signals: await loadSignals() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/build-baseline", async (_request, response, next) => {
  try {
    const sources = await loadSampleSources();
    const signals = await ensureSignals();
    const baselines = buildRoleBaselines(signals, sources);
    await writeJsonFile("roleBaselines.json", baselines);
    response.json({ baselines });
  } catch (error) {
    next(error);
  }
});

app.get("/api/baselines", async (_request, response, next) => {
  try {
    response.json({ baselines: await loadBaselines() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/analyze-profile", async (request, response, next) => {
  try {
    const profile = request.body as DeveloperProfile;
    const baselines = await ensureBaselines();
    const baseline = findBaseline(baselines, profile);

    if (!baseline) {
      response.status(404).json({
        error: `No baseline found for ${profile.targetRole}. Build a baseline first.`
      });
      return;
    }

    const result = await analyzeDeveloperProfile(profile, baseline);
    response.json({ result, baseline });
  } catch (error) {
    next(error);
  }
});

app.post("/api/refactor-introduction", async (request, response, next) => {
  try {
    const profile = request.body as DeveloperProfile;
    const baselines = await ensureBaselines();
    const baseline = findBaseline(baselines, profile);

    if (!baseline) {
      response.status(404).json({
        error: `No baseline found for ${profile.targetRole}. Build a baseline first.`
      });
      return;
    }

    const result = await refactorForRecruiterLens(profile, baseline);
    response.json({ result, baseline });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({
    error: error instanceof Error ? error.message : "Unknown server error"
  });
});

app.listen(port, () => {
  console.log(`BridgePass API listening on http://localhost:${port}`);
});
