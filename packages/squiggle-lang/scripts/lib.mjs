import { SqProject } from "@quri/squiggle-lang";

export const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

export const red = (str) => `\x1b[31m${str}\x1b[0m`;
export const green = (str) => `\x1b[32m${str}\x1b[0m`;

export const run = (src, { output, sampleCount } = {}) => {
  const project = SqProject.create();
  if (sampleCount) {
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
