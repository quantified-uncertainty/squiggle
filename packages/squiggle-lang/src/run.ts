import { defaultEnv, Env } from "./dists/env.js";
import { defaultLinker } from "./public/SqLinker.js";
import { SqProject } from "./public/SqProject/index.js";
import { SqModule } from "./public/SqProject/SqModule.js";
import { SqModuleOutput } from "./public/SqProject/SqModuleOutput.js";

// Simplified interface to SqProject for single-source execution.
export async function run(
  code: string,
  options?: {
    environment?: Env;
  }
): Promise<SqModuleOutput> {
  const project = new SqProject({
    environment: options?.environment ?? defaultEnv,
    linker: defaultLinker,
  });

  project.setHead("root", {
    module: new SqModule({
      name: "main",
      code,
    }),
  });
  return await project.waitForOutput("root");
}
