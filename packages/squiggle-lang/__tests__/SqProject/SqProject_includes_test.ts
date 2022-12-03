import { SqProject } from "../../src";

describe("Parse includes", () => {
  const project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
#include 'common'
x=1`
  );
  project.parseIncludes("main");
  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual(["common"]);
  });
  test("dependents", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("getIncludes", () => {
    const mainIncludes = project.getIncludes("main");
    if (mainIncludes.ok) {
      expect(mainIncludes.value).toEqual(["common"]);
    } else {
      fail(mainIncludes.value.toString());
    }
  });
  test("past chain", () => {
    expect(project.getPastChain("main")).toEqual(["common"]);
  });
  test("import as variables", () => {
    expect(project.getIncludesAsVariables("main")).toEqual([]);
  });
});

describe("Parse includes", () => {
  const project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
#include 'common'
#include 'myModule' as myVariable
x=1`
  );
  project.parseIncludes("main");

  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual(["common", "myModule"]);
  });

  test("dependents", () => {
    expect(project.getDependents("main")).toEqual([]);
  });

  test("getIncludes", () => {
    const mainIncludes = project.getIncludes("main");
    if (mainIncludes.ok) {
      expect(mainIncludes.value).toEqual(["common", "myModule"]);
    } else {
      fail(mainIncludes.value.toString());
    }
  });

  test("direct past chain", () => {
    expect(project.getPastChain("main")).toEqual(["common"]);
  });

  test("direct includes", () => {
    expect(project.getDirectIncludes("main")).toEqual(["common"]);
  });

  test("include as variables", () => {
    expect(project.getIncludesAsVariables("main")).toEqual([
      ["myVariable", "myModule"],
    ]);
  });
});

describe("Parse multiple direct includes", () => {
  let project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
#include 'common' 
#include 'common2'
#include 'myModule' as myVariable
x=1`
  );
  project.parseIncludes("main");
  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual([
      "common",
      "common2",
      "myModule",
    ]);
  });
  test("dependents", () => {
    expect(project.getDependents("main")).toEqual([]);
  });
  test("getIncludes", () => {
    const mainIncludes = project.getIncludes("main");
    if (mainIncludes.ok) {
      expect(mainIncludes.value).toEqual(["common", "common2", "myModule"]);
    } else {
      fail(mainIncludes.value.toString());
    }
  });
  test("direct past chain", () => {
    expect(project.getPastChain("main")).toEqual(["common", "common2"]);
  });
  test("include as variables", () => {
    expect(project.getIncludesAsVariables("main")).toEqual([
      ["myVariable", "myModule"],
    ]);
  });
});
