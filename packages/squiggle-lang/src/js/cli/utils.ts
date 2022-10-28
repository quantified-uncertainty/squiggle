import path from "path";
import fs from "fs";
import { environment } from "..";
import { SqProject } from "../SqProject";
import { SqValueTag } from "../SqValue";

export const red = (str: string) => `\x1b[31;1m${str}\x1b[0m`;
export const bold = (str: string) => `\x1b[1m${str}\x1b[0m`;

export const measure = (cb: () => void, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
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

const _run = (args: {
  src: string;
  filename?: string;
  environment?: environment;
}) => {
  const project = SqProject.create();
  const filename = path.resolve(args.filename || "./__anonymous__");

  const loadIncludesRecursively = (sourceId: string) => {
    project.parseIncludes(sourceId);
    const includes = project.getIncludes(sourceId);
    if (includes.tag === "Error") {
      throw new Error(`Failed to parse includes from ${sourceId}`);
    }
    includes.value.forEach((include) => {
      const includeId = path.join(path.dirname(sourceId), include);
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
  let environment: environment | undefined;
  if (args.sampleCount && Number(args.sampleCount) !== NaN) {
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

  if (result.tag === "Error") {
    console.log(red("Error:"));
    console.log(result.value.toStringWithStackTrace());
  } else {
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (result.value.tag === SqValueTag.Void) {
          console.log(bindings.toString());
        } else {
          console.log(result.value.toString());
        }
        if (args.measure) console.log();
        break;
      case "RESULT_AND_BINDINGS":
        console.log(bold("Result:"));
        console.log(result.value.toString());
        console.log();
        console.log(bold("Bindings:"));
        console.log(bindings.toString());
        if (args.measure) console.log();
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    console.log(bold("Time:"), String(time) + "s");
  }
};
