#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.join(dirname, "../..");
  const packageJson = await fs.readFile(
    path.join(packageRoot, "package.json"),
    "utf-8"
  );
  const { version } = JSON.parse(packageJson);

  const versionTsFile = path.join(packageRoot, "src/library/version.ts");
  const versionTs = await fs.readFile(versionTsFile, "utf-8");
  const re = /(\["System\.version", vString\(")([^"]+)("\))/;
  if (!versionTs.match(re)) {
    throw new Error(`Can't find version in ${versionTsFile}`);
  }

  const patchedVersionTs = versionTs.replace(re, `$1${version}$3`);
  await fs.writeFile(versionTsFile, patchedVersionTs, "utf-8");
}

main();
