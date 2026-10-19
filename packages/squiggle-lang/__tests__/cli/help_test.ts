import { runCLI } from "../helpers/cliHelpers.js";

test("top-level help lists commands and examples", async () => {
  const result = await runCLI(["--help"]);
  expect(result.exitCode).toBe(0);
  for (const command of ["run", "check", "docs", "playground"]) {
    expect(result.stdout).toMatch(new RegExp(`^  ${command} `, "m"));
  }
  expect(result.stdout).toMatch(/Examples:/);
});

test("playground --print-url", async () => {
  const result = await runCLI(["playground", "--print-url"]);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("https://www.squiggle-language.com/playground\n");
});
