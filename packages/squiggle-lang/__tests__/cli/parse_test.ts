import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

it("Parse", async () => {
  const result = await runCLI(["parse", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe(`(Program
  (InfixCall + 2 2)
)
`);
});

it("Parse to JSON", async () => {
  const result = await runCLI(["parse", "--eval", "2+2", "--raw"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(JSON.parse(stripAnsi(result.stdout))).toHaveProperty("kind");
});
