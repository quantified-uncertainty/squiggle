import isFinite from "lodash/isFinite";
import { SqProject } from "../SqProject";
import { SqValueTag } from "../SqValue";

export const measure = (callback: () => void) => {
  const t1 = new Date();
  callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
};

export const red = (str: string) => `\x1b[31m${str}\x1b[0m`;
export const green = (str: string) => `\x1b[32m${str}\x1b[0m`;

export type OutputMode = "NONE" | "RESULT_OR_BINDINGS" | "RESULT_AND_BINDINGS";

export type RunProps = {
  output: OutputMode;
  measure?: boolean;
  sampleCount?: string | number;
};

export const run = (
  src: string,
  props: RunProps = { output: "RESULT_OR_BINDINGS" }
) => {
  const project = SqProject.create();
  if (props.sampleCount && isFinite(Number(props.sampleCount))) {
    project.setEnvironment({
      sampleCount: Number(props.sampleCount),
      xyPointLength: Number(props.sampleCount),
    });
  }
  project.setSource("main", src);
  const time = measure(() => project.run("main"));

  const bindings = project.getBindings("main");
  const result = project.getResult("main");

  // Prints a section consisting of multiple lines; prints an extra "\n" if a section was printed before.
  let isFirstSection = true;
  const printLines = (...lines: string[]) => {
    if (!isFirstSection) {
      console.log();
    }
    isFirstSection = false;
    lines.forEach((line) => console.log(line));
  };

  if (result.tag === "Error") {
    printLines(red("Error:"), result.value.toStringWithStackTrace());
  } else {
    switch (props.output) {
      case "RESULT_OR_BINDINGS":
        if (result.value.tag === SqValueTag.Void) {
          printLines(bindings.toString());
        } else {
          printLines(result.value.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printLines(green("Result:"), result.value.toString());
        printLines(green("Bindings:"), bindings.toString());
        break;
      case "NONE":
      // do nothing
    }
  }

  if (props.measure) {
    printLines(`${green("Time:")} ${time}s`);
  }
};
