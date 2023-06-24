import path from "path";
import { promises as fs } from "fs";
import isFinite from "lodash/isFinite.js";

import { Env } from "../dist/env.js";
import { SqProject } from "../public/SqProject/index.js";
import { bold, red } from "./colors.js";

export async function measure(callback: () => Promise<void>) {
  const t1 = new Date();
  await callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
}

export type OutputMode = "NONE" | "RESULT_OR_BINDINGS" | "RESULT_AND_BINDINGS";

export type RunArgs = {
  src: string;
  filename?: string;
  output: OutputMode;
  measure?: boolean;
  sampleCount?: string | number;
};

async function _run(args: {
  src: string;
  filename?: string;
  environment?: Env;
}) {
  const project = SqProject.create({
    resolver: (name, fromId) => {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error("Only relative paths in imports are allowed");
      }
      return path.resolve(path.dirname(fromId), name);
    },
  });
  if (args.environment) {
    project.setEnvironment(args.environment);
  }
  const filename = path.resolve(args.filename || "./__anonymous__");

  const loader = async (importId: string) => {
    return await fs.readFile(importId, "utf-8");
  };

  project.setSource(filename, args.src);

  const time = await measure(
    async () => await project.runWithImports(filename, loader)
  );
  const bindings = project.getBindings(filename);
  const result = project.getResult(filename);

  return { result, bindings, time };
}

export async function run(args: RunArgs) {
  let environment: Env | undefined;
  if (args.sampleCount && isFinite(Number(args.sampleCount))) {
    environment = {
      sampleCount: Number(args.sampleCount),
      xyPointLength: Number(args.sampleCount),
    };
  }

  const { result, bindings, time } = await _run({
    src: args.src,
    filename: args.filename,
    environment,
  });

  // Prints a section consisting of multiple lines; prints an extra "\n" if a section was printed before.
  let isFirstSection = true;
  const printLines = (...lines: string[]) => {
    if (!isFirstSection) {
      console.log();
    }
    isFirstSection = false;
    lines.forEach((line) => console.log(line));
  };

  if (!result.ok) {
    printLines(red("Error:"), result.value.toStringWithDetails());
  } else {
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (result.value.tag === "Void") {
          printLines(bindings.toString());
        } else {
          printLines(result.value.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printLines(bold("Result:"), result.value.toString());
        printLines(bold("Bindings:"), bindings.toString());
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    printLines(`${bold("Time:")} ${time}s`);
  }
}
