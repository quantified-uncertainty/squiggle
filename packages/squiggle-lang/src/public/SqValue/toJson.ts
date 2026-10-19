import { type JsonValue } from "@quri/serializer";

import { SqDistribution, SqDistributionTag } from "./SqDistribution/index.js";
import { type SqValue } from "./index.js";

export type SqValueToJsonOptions = {
  // Include up to this many raw samples for sample set distributions. Defaults to 0 (no samples).
  samples?: number;
  // Values nested deeper than this are replaced with their string representation.
  maxDepth?: number;
};

type JsonObject = { [key: string]: JsonValue };

// JSON has no representation for Infinity or NaN; we encode them as strings.
function jsonNumber(n: number): number | string {
  return Number.isFinite(n) ? n : String(n);
}

function finiteOrUndefined(n: number): number | undefined {
  return Number.isFinite(n) ? n : undefined;
}

const PERCENTILES = [
  ["p5", 0.05],
  ["p25", 0.25],
  ["p50", 0.5],
  ["p75", 0.75],
  ["p95", 0.95],
] as const;

// Drops `undefined` fields, so that optional fields are omitted from the JSON.
function compact(obj: { [key: string]: JsonValue | undefined }): JsonObject {
  const result: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export function sqDistributionSummary(
  dist: SqDistribution,
  options: SqValueToJsonOptions = {}
): JsonObject {
  const inner = dist._value;
  const stdev = inner.stdev();
  const samples =
    dist.tag === SqDistributionTag.SampleSet ? dist.getSamples() : undefined;

  return compact({
    type: "Dist",
    subtype: dist.tag,
    mean: finiteOrUndefined(inner.mean()),
    stdev: stdev.ok ? finiteOrUndefined(stdev.value) : undefined,
    ...Object.fromEntries(
      PERCENTILES.map(([key, p]) => [key, finiteOrUndefined(inner.inv(p))])
    ),
    min: finiteOrUndefined(inner.min()),
    max: finiteOrUndefined(inner.max()),
    sampleCount: samples?.length,
    samples:
      samples && options.samples && options.samples > 0
        ? samples.slice(0, options.samples)
        : undefined,
    // Symbolic and point set distributions have a short description, e.g. "Normal(5,2)".
    description: samples ? undefined : dist.toString(),
  });
}

function withTags(value: SqValue, json: JsonObject): JsonObject {
  return compact({
    ...json,
    name: value.tags.name(),
    doc: value.tags.doc(),
  });
}

function toJson(
  value: SqValue,
  options: SqValueToJsonOptions,
  depth: number
): JsonValue {
  if (options.maxDepth !== undefined && depth > options.maxDepth) {
    return value.toString();
  }
  const recurse = (v: SqValue) => toJson(v, options, depth + 1);

  switch (value.tag) {
    case "Number":
      return jsonNumber(value.value);
    case "String":
      return value.value;
    case "Bool":
      return value.value;
    case "Void":
      return null;
    case "Array":
      return value.value.getValues().map(recurse);
    case "Dict":
      return Object.fromEntries(
        value.value.entries().map(([k, v]) => [k, recurse(v)])
      );
    case "Date":
      return withTags(value, {
        type: "Date",
        iso: value.value.toDate().toISOString(),
        ms: value.value.toMs(),
      });
    case "Duration":
      return withTags(value, {
        type: "Duration",
        ms: value.value.toMs(),
        display: value.value.toString(),
      });
    case "Dist":
      return withTags(value, sqDistributionSummary(value.value, options));
    case "Lambda": {
      const lambda = value.value;
      return withTags(value, {
        type: "Lambda",
        kind: lambda.type,
        signature: `(${lambda.parameterString()})`,
        parameters: lambda
          .signatures()
          .map((signature) =>
            signature.map((p) => compact({ name: p.name, type: p.typeName }))
          ),
      });
    }
    case "Plot": {
      const plot = value.value;
      return withTags(
        value,
        compact({
          type: "Plot",
          plotType: plot.tag,
          title: plot.title,
          distributions:
            plot.tag === "distributions"
              ? plot.distributions.map(({ name, distribution }) =>
                  compact({
                    name,
                    ...sqDistributionSummary(distribution, options),
                  })
                )
              : undefined,
        })
      );
    }
    case "TableChart": {
      const table = value.value;
      return withTags(value, {
        type: "TableChart",
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        columnNames: table.columnNames.map((n) => n ?? null),
      });
    }
    case "Calculator": {
      const calc = value.value;
      return withTags(
        value,
        compact({
          type: "Calculator",
          title: calc.title,
          description: calc.description,
          inputs: calc.inputs.map((input) =>
            compact({
              name: input.name,
              inputType: input.tag,
              description: input.description,
            })
          ),
        })
      );
    }
    case "Specification": {
      const spec = value.value;
      return withTags(
        value,
        compact({
          type: "Specification",
          specName: spec.name,
          documentation: spec.documentation,
        })
      );
    }
    case "Scale":
    case "Domain":
    case "Input":
      return withTags(value, { type: value.tag, value: value.toString() });
    default:
      throw new Error(`Unknown value ${value satisfies never}`);
  }
}

/**
 * Converts a Squiggle value to a compact, JSON-compatible representation intended for programmatic consumers (CLI `--json`, agents, APIs).
 *
 * Primitives map to JSON primitives, arrays and dicts map to arrays and objects, and everything else becomes an object with a `type` field. Distributions are summarized (mean, stdev, percentiles) instead of dumping all samples.
 */
export function sqValueToJson(
  value: SqValue,
  options: SqValueToJsonOptions = {}
): JsonValue {
  return toJson(value, options, 0);
}
