// Import boundaries that TypeScript can't enforce (Studio has no ESLint).
import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const src = path.join(import.meta.dirname, "../src");

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const importsOf = (file: string): string[] => {
  const text = fs.readFileSync(file, "utf-8");
  const specifiers: string[] = [];
  const pattern =
    /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
  for (const match of text.matchAll(pattern)) {
    specifiers.push(match[1] ?? match[2] ?? match[3]);
  }
  return specifiers;
};

describe("boundaries", () => {
  test("the client never imports @codemirror/* (a second copy breaks StateField identity, §4.7)", () => {
    const offenders = files(path.join(src, "client")).flatMap((file) =>
      importsOf(file)
        .filter((s) => s.startsWith("@codemirror/") || s === "codemirror")
        .map((s) => `${path.relative(src, file)}: ${s}`)
    );
    expect(offenders).toEqual([]);
  });

  test("src/shared is importable by Node and the browser (no React, DOM or Node built-ins)", () => {
    const offenders = files(path.join(src, "shared")).flatMap((file) =>
      importsOf(file)
        .filter(
          (s) =>
            s === "react" ||
            s.startsWith("react-") ||
            s.startsWith("node:") ||
            s.startsWith("@quri/") ||
            s.includes("/client/") ||
            s.includes("/server/")
        )
        .map((s) => `${path.relative(src, file)}: ${s}`)
    );
    expect(offenders).toEqual([]);
  });

  test("the pattern sees imports", () => {
    const sample = path.join(src, "client/commands/registry.tsx");
    expect(importsOf(sample)).toContain("react");
  });
});
