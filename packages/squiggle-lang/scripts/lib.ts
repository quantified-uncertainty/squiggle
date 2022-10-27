import { SqProject } from "../src/js";

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

export const run = (
  src: string,
  {
    output,
    sampleCount,
  }: { output?: boolean; sampleCount?: string | number } = {}
) => {
  const project = SqProject.create();
  if (sampleCount && Number(sampleCount) !== NaN) {
    project.setEnvironment({
      sampleCount: Number(sampleCount),
      xyPointLength: Number(sampleCount),
    });
  }
  project.setSource("main", src);
  const time = measure(() => project.run("main"));

  const bindings = project.getBindings("main");
  const result = project.getResult("main");

  if (output) {
    console.log("Result:", result.tag, result.value.toString());
    console.log("Bindings:", bindings.toString());
  }

  console.log(
    "Time:",
    String(time),
    result.tag === "Error" ? red(result.tag) : green(result.tag),
    result.tag === "Error" ? result.value.toStringWithStackTrace() : ""
  );
};
