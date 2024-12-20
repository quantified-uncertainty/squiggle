import fs from "node:fs/promises";
import { z } from "zod";

import { execWithCapture } from "./lib.js";

export type PackageInfo = {
  version: string;
  name: string;
};
const packageJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
});

export async function getPackageInfo(packageDir: string): Promise<PackageInfo> {
  const packageJsonFilename = `${packageDir}/package.json`;
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonFilename, "utf-8")
  );
  const parsed = packageJsonSchema.safeParse(packageJson);
  if (!parsed.success) {
    console.log(`Failed to parse ${packageJsonFilename}`);
    throw parsed.error;
  }
  return parsed.data;
}

export async function getChangedPackages() {
  const { stdout } = await execWithCapture("git status -s");

  const packageDirs: string[] = [];
  for (const line of stdout.split("\n")) {
    const filename = line.split(" ").at(-1);
    if (filename?.endsWith("CHANGELOG.md")) {
      const packageRoot = filename.replace(/\/CHANGELOG\.md$/, "");
      packageDirs.push(packageRoot);
    }
  }
  return packageDirs;
}
