import { spawn as originalSpawn } from "node:child_process";
import fs from "node:fs/promises";
import util from "node:util";

const promisifiedSpawn = util.promisify(originalSpawn);
export async function exec(command: string) {
  await promisifiedSpawn(command, [], { shell: true, stdio: "inherit" });
}

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
