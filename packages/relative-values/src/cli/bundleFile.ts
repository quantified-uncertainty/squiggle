import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  defaultEnvironment,
  Env,
  SqLinker,
  SqModule,
  SqProject,
} from "@quri/squiggle-lang";

import { findRelativeValuesExports } from "../spec/findExports.js";
import {
  RelativeValuesSpec,
  relativeValuesSpecFromSqValue,
} from "../spec/fromSqValue.js";
import {
  createRelativeValuesBundle,
  RelativeValuesBundle,
} from "../values/bundle.js";
import { ComputeProgress, ModelEvaluator } from "../values/ModelEvaluator.js";

type FileLinker = SqLinker & {
  // Source code of every loaded module, keyed by absolute path.
  sources: Map<string, string>;
};

// Resolves relative imports (`import "./other.squiggle" as other`) from the
// filesystem. Module names are absolute paths.
function makeFileLinker(): FileLinker {
  const sources = new Map<string, string>();
  return {
    sources,
    resolve(name, fromId) {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error(
          `Only relative paths in imports are supported, got "${name}"`
        );
      }
      return path.resolve(path.dirname(fromId), name);
    },
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Hashes are not supported in file imports");
      }
      let code: string;
      try {
        code = await fs.readFile(sourceId, "utf-8");
      } catch (e) {
        throw new Error(
          `Failed to read import "${sourceId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }
      sources.set(sourceId, code);
      return new SqModule({ name: sourceId, code });
    },
  };
}

// Hash of the entry file and all of its imports, so that consumers can check
// whether a bundle is stale.
function hashSources(entry: string, sources: Map<string, string>): string {
  const hash = crypto.createHash("sha256");
  const root = path.dirname(entry);
  const files = [...sources.entries()]
    .map(([file, code]) => [path.relative(root, file), code] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [file, code] of files) {
    hash.update(`${file}\0${code}\0`);
  }
  return `sha256:${hash.digest("hex")}`;
}

function pickSpec(
  output: Awaited<ReturnType<SqProject["waitForOutput"]>>,
  variable: string | undefined
): RelativeValuesSpec {
  const bindings = output.getBindings();
  if (!bindings.ok) {
    throw new Error(
      `The model failed to run:\n${bindings.value.toStringWithDetails()}`
    );
  }

  if (variable !== undefined) {
    const value = bindings.value.get(variable);
    if (!value) {
      throw new Error(`Variable "${variable}" not found in the model`);
    }
    const spec = relativeValuesSpecFromSqValue(value, {
      variableName: variable,
    });
    if (!spec.ok) {
      throw new Error(
        `"${variable}" is not a valid relative values spec: ${spec.value}`
      );
    }
    return spec.value;
  }

  const found = findRelativeValuesExports(output);
  if (found.length === 0) {
    throw new Error(
      "No relative values specs found in the model. A spec is a top-level dict like `{ items: [...], fn: {|a, b| [distA, distB]} }` or `{ values: { id: dist } }`."
    );
  }
  if (found.length > 1) {
    throw new Error(
      `The model has several relative values specs (${found.map((f) => f.name).join(", ")}); pick one with --variable`
    );
  }
  const [{ name, spec }] = found;
  if (!spec.ok) {
    throw new Error(
      `"${name}" is not a valid relative values spec: ${spec.value}`
    );
  }
  return spec.value;
}

export type BundleSquiggleFileParams = {
  file: string;
  // Defaults to the only relative values spec in the file.
  variable?: string;
  seed?: string;
  sampleCount?: number;
  // Significant digits; see `createRelativeValuesBundle`.
  precision?: number;
  generator?: string;
  onProgress?: (progress: ComputeProgress) => void;
  signal?: AbortSignal;
};

/**
 * Evaluate a .squiggle file (with relative imports) and compute a bundle with
 * all pairs of its relative values spec.
 */
export async function bundleSquiggleFile({
  file,
  variable,
  seed,
  sampleCount,
  precision,
  generator,
  onProgress,
  signal,
}: BundleSquiggleFileParams): Promise<RelativeValuesBundle> {
  const entry = path.resolve(file);
  const code = await fs.readFile(entry, "utf-8");

  const environment: Env = {
    ...defaultEnvironment,
    ...(seed !== undefined && { seed }),
    ...(sampleCount !== undefined && { sampleCount }),
  };

  const linker = makeFileLinker();
  linker.sources.set(entry, code);
  const project = new SqProject({ environment, linker });
  project.setHead("root", { module: new SqModule({ name: entry, code }) });
  const output = await project.waitForOutput("root");

  const spec = pickSpec(output, variable);
  const evaluator = await ModelEvaluator.fromSpec(spec, { environment });
  if (!evaluator.ok) {
    throw new Error(evaluator.value);
  }

  return createRelativeValuesBundle({
    definition: spec.definition,
    evaluator: evaluator.value,
    meta: {
      variableName: spec.variableName ?? variable ?? "",
      sourceHash: hashSources(entry, linker.sources),
      ...(generator !== undefined && { generator }),
    },
    precision,
    onProgress,
    signal,
  });
}
