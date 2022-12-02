import path from "path";
import fs from "fs";
import isFinite from "lodash/isFinite";

import { Env } from "../dist/env";
import { SqProject } from "../public/SqProject";
import { bold, red } from "./colors";

export const measure = (callback: () => void) => {
  const t1 = new Date();
  callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
};

export type OutputMode = "NONE" | "RESULT_OR_BINDINGS" | "RESULT_AND_BINDINGS";

export type RunArgs = {
  src: string;
  filename?: string;
  output: OutputMode;
  measure?: boolean;
  sampleCount?: string | number;
};

const _run = (args: { src: string; filename?: string; environment?: Env }) => {
  const project = SqProject.create({
    resolver: (name, fromId) => {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error("Only relative paths in includes are allowed");
      }
      return path.resolve(path.dirname(fromId), name);
    },
  });
  if (args.environment) {
    project.setEnvironment(args.environment);
  }
  const filename = path.resolve(args.filename || "./__anonymous__");

  const loadIncludesRecursively = (sourceId: string) => {
    project.parseIncludes(sourceId);
    const includes = project.getIncludes(sourceId);
    if (!includes.ok) {
      throw new Error(`Failed to parse includes from ${sourceId}`);
    }
    includes.value.forEach((includeId) => {
      const includeSrc = fs.readFileSync(includeId, "utf-8");
      project.setSource(includeId, includeSrc);
      loadIncludesRecursively(includeId);
    });
  };

  project.setSource(filename, args.src);
  loadIncludesRecursively(filename);

  const time = measure(() => project.run(filename));
  const bindings = project.getBindings(filename);
  const result = project.getResult(filename);

  return { result, bindings, time };
};

export const run = (args: RunArgs) => {
  let environment: Env | undefined;
  if (args.sampleCount && isFinite(Number(args.sampleCount))) {
    environment = {
      sampleCount: Number(args.sampleCount),
      xyPointLength: Number(args.sampleCount),
    };
  }

  const { result, bindings, time } = _run({
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
    printLines(red("Error:"), result.value.toStringWithStackTrace());
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
};
