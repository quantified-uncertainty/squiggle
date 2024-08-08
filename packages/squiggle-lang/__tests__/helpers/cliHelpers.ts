import { CommanderError } from "@commander-js/extra-typings";
import { jest } from "@jest/globals";

import { makeProgram } from "../../src/cli/makeProgram.js";

export async function runCLI(args: string[]) {
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
}

// via https://stackoverflow.com/a/29497680
export function stripAnsi(string: string) {
  return string.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}
