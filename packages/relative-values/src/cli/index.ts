import { buildCache } from "@/values/buildCache";
import { Command } from "@commander-js/extra-typings";

export const makeProgram = () => {
  const program = new Command();

  program
    .command("cacheRV")
    .option("-i, --interface <interfaceName>", "Specify an interface id")
    .action(async (options) => {
      await buildCache({ interfaceId: options.interface });
    });

  return program;
};

const main = async () => {
  await makeProgram().parseAsync();
};

if (require.main === module) {
  // running as script, https://stackoverflow.com/a/6398335
  main();
}
