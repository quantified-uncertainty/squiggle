import { defaultEnv, Env } from "./dists/env.js";
import { defaultLinker } from "./public/SqLinker.js";
import { SqProject } from "./public/SqProject/index.js";
import { SqModuleOutput } from "./public/SqProject/SqModuleOutput.js";
import { UnresolvedModule } from "./public/SqProject/UnresolvedModule.js";

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

  project.setHead(
    "root",
    new UnresolvedModule({
      name: "main",
      code,
      linker: defaultLinker,
    })
  );
  return await project.runHead("root");
}
