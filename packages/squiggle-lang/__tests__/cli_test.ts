import * as path from "path";
import { CommanderError } from "@commander-js/extra-typings";
import { makeProgram } from "../src/cli";

afterEach(() => {
  jest.restoreAllMocks();
});

const runCLI = async (args: string[]) => {
  let stdout = "";
  let stderr = "";

  // these mocks are incomplete compared to what native console.log does, but it's good enough
  jest
    .spyOn(console, "log")
    .mockImplementation((...args) => (stdout += args.join(" ") + "\n"));
  jest
    .spyOn(console, "error")
    .mockImplementation((...args) => (stderr += args.join(" ") + "\n"));

  const program = makeProgram();
  program.exitOverride();
  program.configureOutput({
    writeOut: (str) => {
      stdout += str;
    },
    writeErr: (str) => {
      stderr += str;
    },
  });

  let exitCode = 0;
  try {
    await program.parseAsync(args, { from: "user" });
  } catch (e: unknown) {
    if (e instanceof CommanderError) {
      exitCode = e.exitCode;
    } else {
      throw e;
    }
  }

  jest.restoreAllMocks();
  return { stdout, stderr, exitCode };
};

it("Usage output", async () => {
  const result = await runCLI([]);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toMatch(/Usage:/);
});

it("Eval", async () => {
  const result = await runCLI(["run", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("4\n");
});

it("Quiet", async () => {
  const result = await runCLI(["run", "--eval", "2+2", "--quiet"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("");
});

// via https://stackoverflow.com/a/6969486
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};
// via https://stackoverflow.com/a/29497680
const stripAnsi = (string: string) =>
  string.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );

it("Time", async () => {
  const result = await runCLI(["run", "--time", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toMatch(/4\n\nTime: 0(\.\d+)?s\n/);
});

it("Bindings", async () => {
  const result = await runCLI([
    "run",
    "--eval",
    "x = 5; x + 1",
    "--show-bindings",
  ]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe("Result:\n6\n\nBindings:\n{x: 5}\n");
});

it("Code with includes", async () => {
  const filename = path.join(
    __dirname,
    "fixtures",
    "includes",
    "main.squiggle"
  );
  const result = await runCLI(["run", filename]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("Normal(5,2)\n");
});

it("Relative includes", async () => {
  const filename = path.join(
    __dirname,
    "fixtures",
    "relative-includes",
    "main.squiggle"
  );
  const result = await runCLI(["run", filename]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("113\n");
});
