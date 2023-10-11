import { SqProject } from "../../src/public/SqProject/index.js";
import { toStringResult } from "../../src/public/SqValue/index.js";

const runFetchResult = async (project: SqProject, sourceId: string) => {
  await project.run(sourceId);
  const result = project.getResult(sourceId);
  return toStringResult(result);
};

const runFetchFlatBindings = async (project: SqProject, sourceId: string) => {
  await project.run(sourceId);
  const bindingsR = project.getBindings(sourceId);
  if (!bindingsR.ok) {
    return `Error(${bindingsR.value})`;
  }
  return bindingsR.value.toString();
};

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
  expect(await runFetchFlatBindings(project, "variables")).toBe(
    "{myVariable: 666}"
  );
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

  test("continues first", () => {
    expect(project.getContinues("first")).toEqual([]);
  });
  test("continues main", () => {
    expect(project.getContinues("main")).toEqual(["first"]);
  });

  test("test result", async () => {
    expect(await runFetchResult(project, "main")).toBe("Ok(1)");
  });
  test("test bindings", async () => {
    expect(await runFetchFlatBindings(project, "first")).toBe("{x: 1}");
  });
});

describe("project2", () => {
  const project = SqProject.create();
  project.setSource("first", "x=1");
  project.setSource("second", "y=2");
  project.setSource("main", "z=3;y");
  project.setContinues("main", ["second"]);
  project.setContinues("second", ["first"]);

  test("runOrder", () => {
    expect(project.getRunOrder()).toEqual(["first", "second", "main"]);
  });
  test("runOrderFor", () => {
    expect(project.getRunOrderFor("first")).toEqual(["first"]);
  });
  test("runOrderFor", () => {
    expect(project.getRunOrderFor("main")).toEqual(["first", "second", "main"]);
  });
  test("dependencies first", () => {
    expect(project.getDependencies("first")).toEqual([]);
  });
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
    expect(await runFetchFlatBindings(project, "main")).toBe("{z: 3}");
  });
});

describe("removing sources", () => {
  const project = SqProject.create();
  project.setSource("first", "x=1");

  project.setSource("second", "y=2");
  project.setContinues("second", ["first"]);

  project.setSource("main", "y");
  project.setContinues("main", ["second"]);

  project.removeSource("main");

  test("project doesn't have source", () => {
    expect(project.getSource("main")).toBe(undefined);
  });

  test("dependents get updated", () => {
    expect(project.getDependents("second")).toEqual([]);
  });
});

describe("project with import", () => {
  const project = SqProject.create({
    linker: {
      resolve: (name) => name,
      loadSource: () => {
        throw new Error("Loading not supported");
      },
    },
  });

  project.setSource(
    "first",
    `
  import 'common' as common
  x=1`
  );
  project.parseImports("first"); //The only way of setting imports
  //Don't forget to parse imports after changing the source

  project.setSource("common", "common=0");
  project.setSource(
    "second",
    `
  import 'common' as common
  y=2`
  );
  project.setContinues("second", ["first"]);
  project.parseImports("second"); //The only way of setting imports

  project.setSource("main", "z=3; y");
  project.setContinues("main", ["second"]);

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
    expect(project.getDependents("first")).toEqual(["second"]);
  });
  test("dependents common", () => {
    expect(project.getDependents("common")).toEqual(["first", "second"]);
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
    expect(await runFetchFlatBindings(project, "main")).toBe("{z: 3}");
  });
});

describe("project with independent sources", () => {
  const project = SqProject.create();
  project.setSource("first", "1");
  project.setSource("second", "2");

  test("run order of first", () => {
    expect(project.getRunOrderFor("first")).toEqual(["first"]);
  });
  test("run order of second", () => {
    expect(project.getRunOrderFor("second")).toEqual(["second"]);
  });
});
