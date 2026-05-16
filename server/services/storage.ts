import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = path.resolve(__dirname, "../data");

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const filePath = path.join(dataDir, filename);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, value: T): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, filename);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}
