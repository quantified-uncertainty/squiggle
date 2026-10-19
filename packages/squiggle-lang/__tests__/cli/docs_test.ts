import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

async function docsJson(args: string[]) {
  const result = await runCLI(["docs", "--json", ...args]);
  return { ...result, json: JSON.parse(result.stdout) };
}

describe("docs command", () => {
  test("lists namespaces by default", async () => {
    const { json, exitCode } = await docsJson([]);
    expect(exitCode).toBe(0);
    expect(json.type).toBe("namespaces");
    const names = json.namespaces.map((n: { name: string }) => n.name);
    expect(names).toContain("Dist");
    expect(names).toContain("List");
  });

  test("--list", async () => {
    const result = await runCLI(["docs", "--list"]);
    expect(stripAnsi(result.stdout)).toMatch(/Namespaces:/);
  });

  test("full function name", async () => {
    const { json } = await docsJson(["Dist.normal"]);
    expect(json.type).toBe("functions");
    expect(json.functions).toHaveLength(1);
    const fn = json.functions[0];
    expect(fn).toMatchObject({
      fullName: "Dist.normal",
      namespace: "Dist",
      aliases: ["normal"],
    });
    expect(fn.signatures[0]).toMatch(/^Dist\.normal\(/);
    expect(fn.examples.length).toBeGreaterThan(0);
  });

  test("text output for a function", async () => {
    const result = await runCLI(["docs", "List.map"]);
    const stdout = stripAnsi(result.stdout);
    expect(stdout).toMatch(/^List\.map/);
    expect(stdout).toMatch(/Signatures:/);
    expect(stdout).toMatch(/Examples:/);
  });

  test("namespace", async () => {
    const { json } = await docsJson(["List"]);
    expect(json.type).toBe("namespace");
    expect(json.namespace).toBe("List");
    const names = json.functions.map((f: { fullName: string }) => f.fullName);
    expect(names).toContain("List.map");
  });

  test("short name finds all namespaces", async () => {
    const { json } = await docsJson(["normal"]);
    const names = json.functions.map((f: { fullName: string }) => f.fullName);
    expect(names).toContain("Dist.normal");
    expect(names).toContain("Sym.normal");
  });

  test("fuzzy search", async () => {
    const { json } = await docsJson(["lognorm"]);
    expect(json.type).toBe("search");
    const names = json.matches.map((f: { fullName: string }) => f.fullName);
    expect(names).toContain("Dist.lognormal");
  });

  test("not found with suggestions", async () => {
    const result = await runCLI(["docs", "Lst.mapp"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/No documentation found/);
    expect(result.stderr).toMatch(/List\.map/);
  });
});
