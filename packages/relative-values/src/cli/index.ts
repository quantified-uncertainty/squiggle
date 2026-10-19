import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { stringifyRelativeValuesBundle } from "../values/bundle.js";
import { bundleSquiggleFile } from "./bundleFile.js";

const usage = `Usage: squiggle-rv bundle <file.squiggle> [options]

Evaluate a Squiggle model and write all pairwise comparisons of its relative
values spec to a JSON bundle, which RelativeValuesBundleDashboard (or
ModelEvaluator.fromBundle) can render without running Squiggle.

Options:
  --variable <name>      Spec variable (default: the only spec in the file)
  --out <file>           Output file (default: stdout)
  --seed <seed>          Random seed (default: Squiggle's default seed)
  --sample-count <n>     Samples per distribution (default: 1000)
  --precision <digits>   Round numbers to this many significant digits, for
                         smaller bundles (default: full precision)
  --quiet                Don't print progress
  -h, --help             Show this help
`;

async function readVersion(): Promise<string> {
  const pkg: unknown = JSON.parse(
    await fs.readFile(new URL("../../package.json", import.meta.url), "utf-8")
  );
  return typeof pkg === "object" &&
    pkg !== null &&
    "version" in pkg &&
    typeof pkg.version === "string"
    ? pkg.version
    : "unknown";
}

async function bundleCommand(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      variable: { type: "string" },
      out: { type: "string", short: "o" },
      seed: { type: "string" },
      "sample-count": { type: "string" },
      precision: { type: "string" },
      quiet: { type: "boolean", short: "q" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    process.stdout.write(usage);
    return;
  }
  if (positionals.length !== 1) {
    throw new Error(`Expected one .squiggle file\n\n${usage}`);
  }
  const [file] = positionals;

  let sampleCount: number | undefined;
  if (values["sample-count"] !== undefined) {
    sampleCount = Number(values["sample-count"]);
    if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
      throw new Error("--sample-count must be a positive integer");
    }
  }

  let precision: number | undefined;
  if (values.precision !== undefined) {
    precision = Number(values.precision);
    if (!Number.isInteger(precision) || precision < 1 || precision > 100) {
      throw new Error("--precision must be an integer between 1 and 100");
    }
  }

  const showProgress = !values.quiet && process.stderr.isTTY;
  const started = performance.now();
  const bundle = await bundleSquiggleFile({
    file,
    variable: values.variable,
    seed: values.seed,
    sampleCount,
    precision,
    generator: `squiggle-rv@${await readVersion()}`,
    onProgress: showProgress
      ? ({ done, total }) => {
          process.stderr.write(`\rComputing pairs: ${done}/${total}`);
        }
      : undefined,
  });
  if (showProgress) {
    process.stderr.write("\n");
  }

  const failed = bundle.pairs.filter(([, , value]) => "error" in value);
  if (failed.length) {
    const [id1, id2, value] = failed[0];
    const error = "error" in value ? value.error : "";
    process.stderr.write(
      `Warning: ${failed.length} of ${bundle.pairs.length} comparisons failed; first: ${id1} / ${id2}: ${error}\n`
    );
  }

  const json = stringifyRelativeValuesBundle(bundle);
  if (values.out === undefined) {
    process.stdout.write(json);
    return;
  }
  await fs.mkdir(path.dirname(path.resolve(values.out)), { recursive: true });
  await fs.writeFile(values.out, json);
  if (!values.quiet) {
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    process.stderr.write(
      `Wrote ${bundle.definition.items.length} items, ${bundle.pairs.length} pairs to ${values.out} (${seconds}s)\n`
    );
  }
}

async function main(argv: string[]) {
  const [command, ...rest] = argv;
  switch (command) {
    case "bundle":
      return bundleCommand(rest);
    case undefined:
    case "-h":
    case "--help":
    case "help":
      process.stdout.write(usage);
      return;
    default:
      throw new Error(`Unknown command: ${command}\n\n${usage}`);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(
    `Error: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
