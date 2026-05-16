import type { RawCareerSource } from "../../shared/types";
import { readJsonFile } from "./storage";

export async function loadSampleSources(): Promise<RawCareerSource[]> {
  return readJsonFile<RawCareerSource[]>("rawCareerSources.json", []);
}
