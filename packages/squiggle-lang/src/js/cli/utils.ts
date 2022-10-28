import { SqProject } from "../SqProject";
import { SqValueTag } from "../SqValue";

export const measure = (cb: () => void, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
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
  if (props.sampleCount && Number(props.sampleCount) !== NaN) {
    project.setEnvironment({
      sampleCount: Number(props.sampleCount),
      xyPointLength: Number(props.sampleCount),
    });
  }
  project.setSource("main", src);
  const time = measure(() => project.run("main"));

  const bindings = project.getBindings("main");
  const result = project.getResult("main");

  if (result.tag === "Error") {
    console.log(red("Error:"));
    console.log(result.value.toStringWithStackTrace());
  } else {
    switch (props.output) {
      case "RESULT_OR_BINDINGS":
        if (result.value.tag === SqValueTag.Void) {
          console.log(bindings.toString());
        } else {
          console.log(result.value.toString());
        }
        if (props.measure) console.log();
        break;
      case "RESULT_AND_BINDINGS":
        console.log(green("Result:"));
        console.log(result.value.toString());
        console.log();
        console.log(green("Bindings:"));
        console.log(bindings.toString());
        if (props.measure) console.log();
        break;
      case "NONE":
      // do nothing
    }
  }

  if (props.measure) {
    console.log(green("Time:"), String(time) + "s");
  }
};
