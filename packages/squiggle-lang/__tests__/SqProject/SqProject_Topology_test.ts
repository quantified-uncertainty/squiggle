import * as Topology from "../../src/public/SqProject/Topology.js";
import { SqProject } from "../../src/public/SqProject/index.js";

function buildProject(graph: [string, string[]][]) {
  const project = SqProject.create();

  for (const [node, deps] of graph) {
    project.setSource(node, "");
    project.setContinues(node, deps);
    for (const dep of deps) {
      // might create source multiple times, but it shouldn't matter and this helps to define the graph without listing all deps
      project.setSource(dep, "");
    }
  }
  return project;
}

describe("simple", () => {
  const project = buildProject([["main", ["dep1", "dep2"]]]);

  test("getRunOrder", () => {
    expect(Topology.getRunOrder(project)).toEqual(["dep1", "dep2", "main"]);
  });

  test("getRunOrderFor", () => {
    expect(Topology.getRunOrderFor(project, "main")).toEqual([
      "dep1",
      "dep2",
      "main",
    ]);
    expect(Topology.getRunOrderFor(project, "dep1")).toEqual(["dep1"]);
    expect(Topology.getRunOrderFor(project, "dep2")).toEqual(["dep2"]);
  });

  test("getDependents", () => {
    expect(Topology.getDependents(project, "dep1")).toEqual(["main"]);
    expect(Topology.getDependents(project, "main")).toEqual([]);
  });
});

describe("triangle", () => {
  const project = buildProject([
    ["main", ["dep1", "dep2"]],
    ["dep1", ["dep2"]],
  ]);

  test("getRunOrder", () => {
    expect(Topology.getRunOrder(project)).toEqual(["dep2", "dep1", "main"]);
  });

  test("getRunOrderFor", () => {
    expect(Topology.getRunOrderFor(project, "main")).toEqual([
      "dep2",
      "dep1",
      "main",
    ]);
    expect(Topology.getRunOrderFor(project, "dep1")).toEqual(["dep2", "dep1"]);
    expect(Topology.getRunOrderFor(project, "dep2")).toEqual(["dep2"]);
  });

  test("getDependents", () => {
    expect(Topology.getDependents(project, "dep2")).toEqual(["main", "dep1"]);
    expect(Topology.getDependents(project, "dep1")).toEqual(["main"]);
    expect(Topology.getDependents(project, "main")).toEqual([]);
  });
});

describe("nested", () => {
  const project = buildProject([
    ["main", ["a", "b"]],
    ["a", ["c", "d"]],
    ["d", ["e"]],
    ["b", ["c", "a"]],
  ]);

  test("getRunOrder", () => {
    expect(Topology.getRunOrder(project)).toEqual([
      "c",
      "e",
      "d",
      "a",
      "b",
      "main",
    ]);
  });

  test("getDependents", () => {
    expect(Topology.getDependents(project, "a")).toEqual(["main", "b"]);
  });

  test("traverseDependents", () => {
    const order: string[] = [];
    Topology.traverseDependents(project, "d", (id) => order.push(id));
    // depth-first order (shouldn't matter, we use traverseDependents only for cleaning)
    expect(order).toEqual(["main", "b", "a"]);
  });
});
