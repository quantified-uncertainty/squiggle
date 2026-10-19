import { Command } from "@commander-js/extra-typings";

import { SqError } from "../../public/SqError.js";
import { SqProject } from "../../public/SqProject/index.js";
import { SqModule } from "../../public/SqProject/SqModule.js";
import { CliPrinter } from "../CliPrinter.js";
import { green } from "../colors.js";
import {
  ErrorJson,
  exceptionToErrorJson,
  errorToJson,
  printErrorJson,
  printWarnings,
  WarningJson,
  warningsForSources,
} from "../errorReport.js";
import { EVAL_SOURCE_ID, FileLinker, makeFileLinker } from "../linker.js";
import { loadSrc, myParsePositiveInt } from "../utils.js";
import { makeEnvironment } from "./run.js";

export type CheckJsonOutput = {
  ok: boolean;
  files: string[];
  errors: ErrorJson[];
  warnings: WarningJson[];
  ran: boolean;
};

type ErrorReport = { json: ErrorJson; details?: string };

function reportFromSqError(
  error: SqError,
  sources: ReadonlyMap<string, string>
): ErrorReport {
  return {
    json: errorToJson(error, sources),
    details: error.toStringWithDetails(),
  };
}

// Parses and type-checks a module and all of its imports, without evaluating anything.
async function staticCheck(
  root: SqModule,
  linker: FileLinker
): Promise<ErrorReport[]> {
  const reports: ErrorReport[] = [];
  const visited = new Set<string>();

  const visit = async (module: SqModule) => {
    if (visited.has(module.name)) return;
    visited.add(module.name);

    const typedAst = module.typedAst();
    if (!typedAst.ok) {
      for (const error of typedAst.value) {
        reports.push(reportFromSqError(error, linker.sources));
      }
    }

    const ast = module.ast();
    if (!ast.ok) return;
    for (const importNode of ast.value.imports) {
      const location = importNode.path.location;
      const fail = (e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        reports.push({
          json: {
            kind: "compile",
            message,
            location: {
              file: location.source,
              start: {
                line: location.start.line,
                column: location.start.column,
              },
              end: { line: location.end.line, column: location.end.column },
            },
          },
        });
      };
      let name: string;
      try {
        name = linker.resolve(importNode.path.value, module.name);
      } catch (e) {
        fail(e);
        continue;
      }
      if (visited.has(name)) continue;
      try {
        await visit(await linker.loadModule(name));
      } catch (e) {
        fail(e);
      }
    }
  };

  await visit(root);
  return reports;
}

type CheckResult = {
  reports: ErrorReport[];
  warnings: WarningJson[];
  files: string[];
  ran: boolean;
};

async function check(params: {
  src: string;
  filename: string | undefined;
  run: boolean;
  seed: string | undefined;
  sampleCount: number | undefined;
  warnings: boolean;
}): Promise<CheckResult> {
  const linker = makeFileLinker();
  const rootName = params.filename ?? EVAL_SOURCE_ID;
  linker.sources.set(rootName, params.src);
  const root = new SqModule({ name: rootName, code: params.src });

  const reports = await staticCheck(root, linker);

  let ran = false;
  if (params.run && reports.length === 0) {
    ran = true;
    const project = new SqProject({
      linker,
      environment: makeEnvironment({
        seed: params.seed,
        sampleCount: params.sampleCount,
      }),
    });
    project.setHead("root", { module: root });
    const output = await project.waitForOutput("root");
    if (!output.result.ok) {
      for (const error of output.result.value.errors) {
        reports.push(reportFromSqError(error, linker.sources));
      }
    }
  }

  return {
    reports,
    warnings: params.warnings ? warningsForSources(linker.sources) : [],
    files: [...linker.sources.keys()],
    ran,
  };
}

export function addCheckCommand(program: Command) {
  program
    .command("check")
    .description(
      "Type-check code and its imports without running; report errors, hints, warnings"
    )
    .arguments("[filename]")
    .option("-e, --eval <code>", "check a code string instead of a file")
    .option(
      "--json",
      "print a JSON object {ok, files, errors, warnings, ran} to stdout"
    )
    .option(
      "--run",
      "also evaluate the code to catch runtime errors (only if type-checking passed)"
    )
    .option("--seed <seed>", "random seed, with --run")
    .option(
      "-n, --sample-count <n>",
      "number of samples, with --run",
      myParsePositiveInt
    )
    .option("--no-warnings", "don't report lint warnings")
    .addHelpText(
      "after",
      `
Examples:
  $ squiggle check model.squiggle
  $ squiggle check model.squiggle --json
  $ squiggle check model.squiggle --run

Exit code is 1 if there are errors. Warnings are heuristic and don't affect the exit code.`
    )
    .action(async (filename, options) => {
      const src = loadSrc({ program, filename, inline: options.eval });

      let result: CheckResult;
      try {
        result = await check({
          src,
          filename,
          run: options.run ?? false,
          seed: options.seed,
          sampleCount: options.sampleCount,
          warnings: options.warnings,
        });
      } catch (e) {
        if (!options.json) throw e;
        // `--json` promises a single JSON object on stdout, so unexpected exceptions are reported in it too.
        result = {
          reports: [{ json: exceptionToErrorJson(e) }],
          warnings: [],
          files: [],
          ran: false,
        };
      }
      const { reports, warnings, files, ran } = result;

      const ok = reports.length === 0;
      if (!ok) {
        process.exitCode = 1;
      }

      if (options.json) {
        const output: CheckJsonOutput = {
          ok,
          files,
          errors: reports.map((r) => r.json),
          warnings,
          ran,
        };
        console.log(JSON.stringify(output, null, 2));
        return;
      }

      const printer = new CliPrinter();
      for (const report of reports) {
        printErrorJson(printer, report.json, report.details);
      }
      printWarnings(printer, warnings);
      if (ok) {
        printer.printSection(
          green(
            `OK: no errors in ${files.length} file(s)${ran ? " (type-checked and ran)" : " (type-checked, not run)"}`
          )
        );
      }
    });
}
