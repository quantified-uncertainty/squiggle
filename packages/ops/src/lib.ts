import { exec as originalExec } from "node:child_process";
import fs from "node:fs/promises";
import util from "node:util";

export const exec = util.promisify(originalExec);

export async function exists(f: string): Promise<boolean> {
  let exists = true;
  await fs.stat(f).catch((err) => {
    if (err.code === "ENOENT") exists = false;
  });
  return exists;
}

export type PackageInfo = {
  version: string;
  name: string;
};

export async function getPackageInfo(packageDir: string): Promise<PackageInfo> {
  const packageJson = JSON.parse(
    await fs.readFile(`${packageDir}/package.json`, "utf-8")
  );
  return { version: packageJson.version, name: packageJson.name }; // TODO: zod
}
