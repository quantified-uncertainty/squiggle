import { SqLinker } from "../../src/index.js";
import { SqProject } from "../../src/public/SqProject/index.js";
import { toStringResult } from "../../src/public/SqValue/index.js";

export async function runFetchResult(project: SqProject, sourceId: string) {
  await project.run(sourceId);
  const result = project.getResult(sourceId);
  return toStringResult(result);
}

export async function runFetchBindings(project: SqProject, sourceId: string) {
  await project.run(sourceId);
  const bindingsR = project.getBindings(sourceId);
  if (!bindingsR.ok) {
    return `Error(${bindingsR.value})`;
  }
  return bindingsR.value.toString();
}

export async function runFetchExports(project: SqProject, sourceId: string) {
  await project.run(sourceId);
  const outputR = project.getOutput(sourceId);
  if (!outputR.ok) {
    return `Error(${outputR.value})`;
  }
  return outputR.value.exports.toString();
}

export function buildNaiveLinker(sources?: { [k: string]: string }) {
  const linker: SqLinker = {
    resolve: (name) => name,
    loadSource: async (id) => {
      if (sources && id in sources) {
        return sources[id];
      }
      throw new Error(`Unknown id ${id}`);
    },
  };
  return linker;
}
