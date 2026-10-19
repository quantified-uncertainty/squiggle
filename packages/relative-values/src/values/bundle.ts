import { z } from "zod";

import { result } from "@quri/squiggle-lang";

import {
  RelativeValuesDefinition,
  relativeValuesDefinitionSchema,
} from "../types.js";
import { InMemoryRelativeValuesCache, makePairKey, PairKey } from "./cache.js";
import type { ComputeOptions, ModelEvaluator } from "./ModelEvaluator.js";
import { RelativeValue, RelativeValueResult } from "./types.js";

export const RELATIVE_VALUES_BUNDLE_VERSION = 1;

// JSON can't represent non-finite numbers, so they're stored as strings.
const bundleNumberSchema = z.union([
  z.number(),
  z.enum(["Infinity", "-Infinity", "NaN"]),
]);

export type BundleNumber = z.infer<typeof bundleNumberSchema>;

const bundlePairValueSchema = z.union([
  z.object({
    median: bundleNumberSchema,
    mean: bundleNumberSchema,
    min: bundleNumberSchema, // p5
    max: bundleNumberSchema, // p95
    uncertainty: bundleNumberSchema,
  }),
  // The comparison failed, e.g. the model threw an error for this pair.
  z.object({ error: z.string() }),
]);

export const relativeValuesBundleMetaSchema = z
  .object({
    // ISO 8601 timestamp.
    generatedAt: z.string(),
    // Squiggle variable that holds the spec.
    variableName: z.string(),
    // Squiggle environment that the pairs were computed with.
    seed: z.string(),
    sampleCount: z.number().int().positive(),
    // Hash of the model's source code (including imports), e.g. "sha256:...".
    // Lets you check whether a bundle is stale.
    sourceHash: z.string().optional(),
    // Tool that generated the bundle, e.g. "squiggle-rv@0.1.0".
    generator: z.string().optional(),
  })
  // Allow custom metadata.
  .passthrough();

export const relativeValuesBundleSchema = z
  .object({
    version: z.literal(RELATIVE_VALUES_BUNDLE_VERSION),
    definition: relativeValuesDefinitionSchema,
    // `[id1, id2, value]`: the value of `id1` in terms of `id2`.
    pairs: z.array(z.tuple([z.string(), z.string(), bundlePairValueSchema])),
    meta: relativeValuesBundleMetaSchema,
  })
  .superRefine((bundle, ctx) => {
    const ids = new Set(bundle.definition.items.map((item) => item.id));
    for (const [i, [id1, id2]] of bundle.pairs.entries()) {
      for (const id of [id1, id2]) {
        if (!ids.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pairs", i],
            message: `Unknown item id: ${id}`,
          });
          return;
        }
      }
    }
  });

/**
 * Precomputed relative values: the definition (items, clusters) and the
 * summary of every pair of items.
 *
 * A bundle is plain JSON, so it can be generated ahead of time (e.g. with the
 * `squiggle-rv bundle` CLI command) and loaded by an app that doesn't run
 * Squiggle at all.
 */
export type RelativeValuesBundle = z.infer<typeof relativeValuesBundleSchema>;

export type RelativeValuesBundleMeta = z.infer<
  typeof relativeValuesBundleMetaSchema
>;

export type RelativeValuesBundlePair = RelativeValuesBundle["pairs"][number];

function encodeNumber(value: number): BundleNumber {
  if (Number.isFinite(value)) {
    return value;
  }
  return Number.isNaN(value) ? "NaN" : value > 0 ? "Infinity" : "-Infinity";
}

function decodeNumber(value: BundleNumber): number {
  return typeof value === "number" ? value : Number(value);
}

function encodePairValue(
  result: RelativeValueResult
): RelativeValuesBundlePair[2] {
  if (!result.ok) {
    return { error: result.value };
  }
  const { median, mean, min, max, uncertainty } = result.value;
  return {
    median: encodeNumber(median),
    mean: encodeNumber(mean),
    min: encodeNumber(min),
    max: encodeNumber(max),
    uncertainty: encodeNumber(uncertainty),
  };
}

function decodePairValue(
  value: RelativeValuesBundlePair[2]
): RelativeValueResult {
  if ("error" in value) {
    return { ok: false, value: value.error };
  }
  const decoded: RelativeValue = {
    median: decodeNumber(value.median),
    mean: decodeNumber(value.mean),
    min: decodeNumber(value.min),
    max: decodeNumber(value.max),
    uncertainty: decodeNumber(value.uncertainty),
  };
  return { ok: true, value: decoded };
}

/**
 * Validate a bundle, e.g. the result of `JSON.parse` or of a JSON import.
 */
export function parseRelativeValuesBundle(
  json: unknown
): result<RelativeValuesBundle, string> {
  if (
    typeof json === "object" &&
    json !== null &&
    "version" in json &&
    json.version !== RELATIVE_VALUES_BUNDLE_VERSION
  ) {
    return {
      ok: false,
      value: `Unsupported relative values bundle version: ${String(json.version)} (expected ${RELATIVE_VALUES_BUNDLE_VERSION})`,
    };
  }
  const parsed = relativeValuesBundleSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    return {
      ok: false,
      value: `Invalid relative values bundle:\n${issues.join("\n")}`,
    };
  }
  return { ok: true, value: parsed.data };
}

/**
 * Cache with all pairs from the bundle.
 */
export function relativeValuesCacheFromBundle(
  bundle: RelativeValuesBundle
): InMemoryRelativeValuesCache {
  return new InMemoryRelativeValuesCache(
    bundle.pairs.map(([id1, id2, value]): [PairKey, RelativeValueResult] => [
      makePairKey(id1, id2),
      decodePairValue(value),
    ])
  );
}

export type CreateRelativeValuesBundleParams = {
  definition: RelativeValuesDefinition;
  // Must be able to compute pairs (not built with `fromCache`/`fromBundle`).
  evaluator: ModelEvaluator;
  meta: {
    variableName: string;
    sourceHash?: string;
    generator?: string;
    // Defaults to now.
    generatedAt?: string;
    // Default to the evaluator's environment.
    seed?: string;
    sampleCount?: number;
    // Custom metadata.
    [key: string]: unknown;
  };
} & ComputeOptions;

/**
 * Compute all n² pairs of the definition's items and pack them into a
 * JSON-serializable bundle.
 */
export async function createRelativeValuesBundle({
  definition,
  evaluator,
  meta,
  ...computeOptions
}: CreateRelativeValuesBundleParams): Promise<RelativeValuesBundle> {
  const environment = evaluator.environment;
  if (!evaluator.canCompute || !environment) {
    throw new Error(
      "Can't create a bundle with a cache-only evaluator; use an evaluator built from Squiggle code"
    );
  }

  const ids = definition.items.map((item) => item.id);
  const results = await evaluator.computeAll(ids, computeOptions);

  const pairs: RelativeValuesBundlePair[] = [];
  let i = 0;
  for (const id1 of ids) {
    for (const id2 of ids) {
      pairs.push([id1, id2, encodePairValue(results[i])]);
      i++;
    }
  }

  return {
    version: RELATIVE_VALUES_BUNDLE_VERSION,
    definition: {
      title: definition.title,
      items: definition.items,
      clusters: definition.clusters,
      recommendedUnit: definition.recommendedUnit ?? null,
    },
    pairs,
    meta: {
      ...meta,
      generatedAt: meta.generatedAt ?? new Date().toISOString(),
      seed: meta.seed ?? environment.seed,
      sampleCount: meta.sampleCount ?? environment.sampleCount,
    },
  };
}

/**
 * `JSON.stringify` for bundles, with one pair per line, so that bundles
 * committed to git produce readable diffs.
 */
export function stringifyRelativeValuesBundle(
  bundle: RelativeValuesBundle
): string {
  const { pairs, ...rest } = bundle;
  const head = JSON.stringify(rest, null, 2);
  const pairLines = pairs.map((pair) => "    " + JSON.stringify(pair));
  return (
    head.slice(0, head.lastIndexOf("}")).trimEnd() +
    ',\n  "pairs": [\n' +
    pairLines.join(",\n") +
    "\n  ]\n}\n"
  );
}
