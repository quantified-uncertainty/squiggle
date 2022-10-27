import { SqProject } from "../SqProject";

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

type RunProps = {
  output?: boolean;
  measure?: boolean;
  sampleCount?: string | number;
};

export const run = (src: string, props: RunProps = {}) => {
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
    console.log("Result:");
    console.log(red("Error"));
    console.log();
    console.log(result.value.toStringWithStackTrace());
  } else if (props.output) {
    console.log("Result:");
    console.log(green(result.tag), result.value.toString());
    console.log();
    console.log("Bindings:", bindings.toString());
    if (props.measure) console.log();
  }

  if (props.measure) {
    console.log("Time:", String(time) + "s");
  }
};
