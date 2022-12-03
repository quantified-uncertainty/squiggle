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
  expect(runFetchResult(project, "main")).toBe("Ok(true)");
});

test("test result false", () => {
  const project = SqProject.create();
  project.setSource("main", "false");
  expect(runFetchResult(project, "main")).toBe("Ok(false)");
});

test("test library", () => {
  const project = SqProject.create();
  project.setSource("main", "x=Math.pi; x");
  expect(runFetchResult(project, "main")).toBe("Ok(3.141592653589793)");
});

test("test bindings", () => {
  const project = SqProject.create();
  project.setSource("variables", "myVariable=666");
  expect(runFetchFlatBindings(project, "variables")).toBe("{myVariable: 666}");
});

describe("project1", () => {
  const project = SqProject.create();
  project.setSource("first", "x=1");
  project.setSource("main", "x");
  project.setContinues("main", ["first"]);

  test("runOrder", () => {
    expect(project.getRunOrder()).toEqual(["first", "main"]);
  });
  test("dependents first", () => {
    expect(project.getDependents("first")).toEqual(["main"]);
  });
  test("dependencies first", () => {
    expect(project.getDependencies("first")).toEqual([]);
  });
  test("dependents main", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("dependencies main", () => {
    expect(project.getDependencies("main")).toEqual(["first"]);
  });

  test("past chain first", () => {
    expect(project.getPastChain("first")).toEqual([]);
  });
  test("past chain main", () => {
    expect(project.getPastChain("main")).toEqual(["first"]);
  });

  test("test result", () => {
    expect(runFetchResult(project, "main")).toBe("Ok(1)");
  });
  test("test bindings", () => {
    expect(runFetchFlatBindings(project, "first")).toBe("{x: 1}");
  });
});

describe("project2", () => {
  const project = SqProject.create();
  project.setContinues("main", ["second"]);
  project.setContinues("second", ["first"]);
  project.setSource("first", "x=1");
  project.setSource("second", "y=2");
  project.setSource("main", "z=3;y");

  test("runOrder", () => {
    expect(project.getRunOrder()).toEqual(["first", "second", "main"]);
  });
  test("runOrderFor", () => {
    expect(project.getRunOrderFor("first")).toEqual(["first"]);
  });
  test("dependencies first", () => {
    expect(project.getDependencies("first")).toEqual([]);
  });
  test("dependents first", () => {
    expect(project.getDependents("first")).toEqual(["second", "main"]);
  });
  test("dependents main", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("dependencies main", () => {
    expect(project.getDependencies("main")).toEqual(["first", "second"]);
  });
  test("test result", () => {
    expect(runFetchResult(project, "main")).toBe("Ok(2)");
  });
  test("test bindings", () => {
    // bindings from continues are not exposed!
    expect(runFetchFlatBindings(project, "main")).toBe("{z: 3}");
  });
});

describe("removing sources", () => {
  const project = SqProject.create();
  project.setContinues("main", ["second"]);
  project.setContinues("second", ["first"]);
  project.setSource("first", "x=1");
  project.setSource("second", "y=2");
  project.setSource("main", "y");

  project.removeSource("main");

  test("project doesn't have source", () => {
    expect(project.getSource("main")).toBe(undefined);
  });

  test("dependents get updated", () => {
    expect(project.getDependents("second")).toEqual([]);
  });
});

describe("project with include", () => {
  const project = SqProject.create({
    resolver: (name) => name,
  });
  project.setContinues("main", ["second"]);
  project.setContinues("second", ["first"]);

  project.setSource(
    "first",
    `
  #include 'common'
  x=1`
  );
  project.parseIncludes("first");
  project.parseIncludes("first"); //The only way of setting includes
  //Don't forget to parse includes after changing the source

  project.setSource("common", "common=0");
  project.setSource(
    "second",
    `
  #include 'common'
  y=2`
  );
  project.parseIncludes("second"); //The only way of setting includes

  project.setSource("main", "z=3; y");

  test("runOrder", () => {
    expect(project.getRunOrder()).toEqual([
      "common",
      "first",
      "second",
      "main",
    ]);
  });

  test("runOrderFor", () => {
    expect(project.getRunOrderFor("first")).toEqual(["common", "first"]);
  });

  test("dependencies first", () => {
    expect(project.getDependencies("first")).toEqual(["common"]);
  });
  test("dependents first", () => {
    expect(project.getDependents("first")).toEqual(["second", "main"]);
  });
  test("dependents main", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("dependencies main", () => {
    expect(project.getDependencies("main")).toEqual([
      "common",
      "first",
      "second",
    ]);
  });
  test("test result", () => {
    expect(runFetchResult(project, "main")).toBe("Ok(2)");
  });
  test("test bindings", () => {
    // bindings from continues are not exposed!
    expect(runFetchFlatBindings(project, "main")).toBe("{z: 3}");
  });
});

describe("project with independent sources", () => {
  let project = SqProject.create();
  project.setSource("first", "1");
  project.setSource("second", "2");
  test("run order of first", () => {
    expect(project.getRunOrderFor("first")).toEqual(["first"]);
  });
  test("run order of second", () => {
    expect(project.getRunOrderFor("second")).toEqual(["second"]);
  });
});
