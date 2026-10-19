import fs from "node:fs";

export function readExample(name: string): string {
  return fs.readFileSync(
    new URL(`../examples/${name}`, import.meta.url),
    "utf-8"
  );
}
