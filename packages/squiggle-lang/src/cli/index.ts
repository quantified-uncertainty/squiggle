import { makeProgram } from "./makeProgram.js";

const main = async () => {
  await makeProgram().parseAsync();
};

main().catch((error) => {
  console.error(
    error instanceof Error ? `Error: ${error.message}` : String(error)
  );
  process.exitCode = 1;
});
