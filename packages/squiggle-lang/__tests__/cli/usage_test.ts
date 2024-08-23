import { runCLI } from "../helpers/cliHelpers.js";

test("Usage output", async () => {
  const result = await runCLI([]);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toMatch(/Usage:/);
});
