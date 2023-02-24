import { SqProject } from "../../src/public/SqProject";
import { toStringResult } from "../../src/public/SqValue";

const runFetchResult = (project: SqProject, sourceId: string) => {
  project.run(sourceId);
  const result = project.getResult(sourceId);
  return toStringResult(result);
};

const runFetchFlatBindings = (project: SqProject, sourceId: string) => {
  project.run(sourceId);
  return project.getBindings(sourceId).toString();
};

test("test result true", () => {
  const project = SqProject.create();
  project.setSource("main", "true");
  project.enableProfiler();
  project.runAll();
  expect(project.getPerformanceMetrics()).not.toBeUndefined();
  expect(project.getPerformanceMetrics()?.frameTimes).toHaveProperty("<root>");
});

test("test result true", () => {
  const project = SqProject.create();
  project.setSource(
    "main",
    `f(x) = normal(x, 2) * normal(-2, 3)
  dist = normal(2, 3)
  SampleSet.map(SampleSet.fromDist(dist), {|x| f(x) / x})`
  );
  project.enableProfiler();
  project.runAll();
  expect(project.getPerformanceMetrics()).not.toBeUndefined();
  expect(project.getPerformanceMetrics()?.frameTimes).toHaveProperty("f");
});
