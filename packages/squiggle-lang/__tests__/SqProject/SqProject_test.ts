import { SqProject } from "../../src/public/SqProject/index.js";
import {
  runFetchBindings,
  runFetchExports,
  runFetchResult,
} from "../helpers/projectHelpers.js";

test("test result true", async () => {
  const project = SqProject.create();
  project.setSource("main", "true");
  expect(await runFetchResult(project, "main")).toBe("Ok(true)");
});

test("test result false", async () => {
  const project = SqProject.create();
  project.setSource("main", "false");
  expect(await runFetchResult(project, "main")).toBe("Ok(false)");
});

test("test library", async () => {
  const project = SqProject.create();
  project.setSource("main", "x=Math.pi; x");
  expect(await runFetchResult(project, "main")).toBe("Ok(3.141592653589793)");
});

test("test bindings", async () => {
  const project = SqProject.create();
  project.setSource("variables", "myVariable=666");
  expect(await runFetchBindings(project, "variables")).toBe(
    "{myVariable: 666}"
  );
});

test("test exports", async () => {
  const project = SqProject.create();
  project.setSource("main", "x = 5; export y = 6; z = 7; export t = 8");
  expect(await runFetchExports(project, "main")).toBe("{y: 6,t: 8}");
});

describe("removing sources", () => {
  const getCommonProject = () => {
    const project = SqProject.create();
    project.setSource("A", "x=1");

    project.setSource("B", "y=2");
    project.setContinues("B", ["A"]);

    project.setSource("C", "y");
    project.setContinues("C", ["B"]);

    return project;
  };

  test("leaf", () => {
    const project = getCommonProject();

    expect(project.getSourceIds()).toEqual(["A", "B", "C"]);

    expect(project.getDependents("C")).toEqual([]);
    expect(project.getDependencies("C")).toEqual(["B"]);

    project.removeSource("C");
    expect(project.getSourceIds()).toEqual(["A", "B"]);

    expect(project.getSource("C")).toBe(undefined);

    expect(project.getDependents("C")).toEqual([]);
    expect(() => project.getDependencies("C")).toThrow();
  });

  test("intermediate", () => {
    const project = getCommonProject();

    expect(project.getSourceIds()).toEqual(["A", "B", "C"]);

    expect(project.getDependents("B")).toEqual(["C"]);
    expect(project.getDependencies("B")).toEqual(["A"]);

    project.removeSource("B");
    expect(project.getSourceIds()).toEqual(["A", "C"]);

    expect(project.getSource("B")).toBe(undefined);

    // the dependency is still there, but evaluating "C" will fail because "B" got removed
    expect(project.getDependents("B")).toEqual(["C"]);
    expect(() => project.getDependencies("B")).toThrow();
  });
});

describe("project with independent sources", () => {
  test("run first", async () => {
    const project = SqProject.create();
    project.setSource("first", "1");
    project.setSource("second", "2");

    expect(await runFetchResult(project, "first")).toBe("Ok(1)");
    expect(project.getOutput("second").ok).toBe(false);
    expect(project.getOutput("second").value.toString()).toMatch("Need to run");
  });

  test("run second", async () => {
    const project = SqProject.create();
    project.setSource("first", "1");
    project.setSource("second", "2");

    expect(await runFetchResult(project, "second")).toBe("Ok(2)");
    expect(project.getOutput("first").ok).toBe(false);
    expect(project.getOutput("first").value.toString()).toMatch("Need to run");
  });
});
