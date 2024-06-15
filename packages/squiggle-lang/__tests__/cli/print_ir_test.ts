import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

it("Print IR", async () => {
  const result = await runCLI(["print-ir", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe(`(Program
  (.statements
    (Call add 2 2)
  )
)
`);
});
