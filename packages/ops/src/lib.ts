import { spawn } from "node:child_process";
import fs from "node:fs/promises";

export async function exec(command: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(command, [], { shell: true, stdio: "inherit" });
    process.on("close", (code) => {
      if (code) {
        reject(`${command} failed\nError ${code}`);
      } else {
        resolve();
      }
    });
  });
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
