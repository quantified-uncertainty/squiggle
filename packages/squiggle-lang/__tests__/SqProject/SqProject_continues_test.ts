import { SqProject } from "../../src/index.js";
import {
  buildNaiveLinker,
  runFetchBindings,
  runFetchResult,
} from "../helpers/projectHelpers.js";

describe("continues", () => {
  test("order 1", async () => {
    const project = SqProject.create();
    project.setSource("first", "x = 1");
    project.setSource("main", "x + 1");
    project.setContinues("main", ["first"]);

    expect(await runFetchResult(project, "main")).toBe("Ok(2)");
  });

  test("order 2", async () => {
    const project = SqProject.create();
    project.setSource("main", "x + 1");
    project.setSource("first", "x = 1");
    project.setContinues("main", ["first"]);

    expect(await runFetchResult(project, "main")).toBe("Ok(2)");
  });

  test("getContinues", () => {
    const project = SqProject.create();
    project.setSource("first", "x=1");
    project.setSource("main", "x + 1");
    project.setContinues("main", ["first"]);
    expect(project.getContinues("main")).toEqual(["first"]);
    expect(project.getContinues("first")).toEqual([]);
  });
});

describe("dependencies and dependents", () => {
  const project = SqProject.create();
  project.setSource("first", "x=1");
  project.setSource("second", "y=2");
  project.setSource("main", "z=3;y");
  project.setContinues("main", ["second"]);
  project.setContinues("second", ["first"]);

  test("dependents first", () => {
    expect(project.getDependents("first")).toEqual(["second"]);
  });
  test("dependents second", () => {
    expect(project.getDependents("second")).toEqual(["main"]);
  });
  test("dependents main", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("dependencies main", () => {
    expect(project.getDependencies("main")).toEqual(["second"]);
  });
  test("test result", async () => {
    expect(await runFetchResult(project, "main")).toBe("Ok(2)");
  });
  test("test bindings", async () => {
    // bindings from continues are not exposed!
    expect(await runFetchBindings(project, "main")).toBe("{z: 3}");
  });
});

describe("dynamic loading", () => {
  const project = SqProject.create({
    linker: buildNaiveLinker({
      first: "x=1",
      second: "y=2",
    }),
  });
  project.setSource("main", "x+y");
  project.setContinues("main", ["first", "second"]);

  test("test result", async () => {
    expect(await runFetchResult(project, "main")).toBe("Ok(3)");
  });
});
