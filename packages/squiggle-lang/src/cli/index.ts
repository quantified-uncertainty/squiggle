import { makeProgram } from "./makeProgram.js";

const main = async () => {
  await makeProgram().parseAsync();
};

main();
