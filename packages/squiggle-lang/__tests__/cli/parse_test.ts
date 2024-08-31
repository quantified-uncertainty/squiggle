import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

test("Parse", async () => {
  const result = await runCLI(["parse", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe(`(Program
  (InfixCall + 2 2)
)
`);
});

test("Parse to JSON", async () => {
  const result = await runCLI(["parse", "--eval", "2+2", "--mode", "raw"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(JSON.parse(stripAnsi(result.stdout))).toHaveProperty("kind");
});

test("Parse and analyze", async () => {
  const result = await runCLI(["parse", "--eval", "2+2", "--mode", "typed"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe(`(Program
  (InfixCall + 2 2 :Number)
)
`);
});
