import { defaultEnv, Env } from "./dists/env.js";
import { defaultLinker } from "./public/SqLinker.js";
import { SqProject } from "./public/SqProject/index.js";
import { ModuleOutput } from "./public/SqProject/ModuleOutput.js";
import { UnresolvedModule } from "./public/SqProject/UnresolvedModule.js";

// Simplified interface to SqProject for single-source execution.
export async function run(
  code: string,
  options?: {
    environment?: Env;
  }
): Promise<ModuleOutput> {
  const project = new SqProject({
    rootSource: new UnresolvedModule({
      name: "main",
      code,
      linker: defaultLinker,
    }),
    environment: options?.environment ?? defaultEnv,
    linker: defaultLinker,
  });
  return new Promise<ModuleOutput>((resolve) => {
    project.addEventListener("output", (event) => {
      resolve(event.data.output);
    });
  });
}
