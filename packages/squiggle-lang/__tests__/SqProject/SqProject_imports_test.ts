import { SqProject } from "../../src/index.js";

describe("Parse imports", () => {
  const project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
import './common' as common
import "./myModule" as myVariable
x=1`
  );
  project.parseImports("main");

  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual(["./common", "./myModule"]);
  });

  test("getImportIds", () => {
    const mainImportIds = project.getImportIds("main");
    if (mainImportIds.ok) {
      expect(mainImportIds.value).toEqual(["./common", "./myModule"]);
    } else {
      fail(mainImportIds.value.toString());
    }
  });

  test("getImports", () => {
    expect(project.getImports("main")).toEqual({
      ok: true,
      value: [
        { variable: "common", sourceId: "./common" },
        { variable: "myVariable", sourceId: "./myModule" },
      ],
    });
  });

  test("continues", () => {
    expect(project.getContinues("main")).toEqual([]);
  });
});

describe("Unknown imports", () => {
  const project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
import './lib' as lib
123`
  );

  project.run("main");

  expect(project.getResult("main").ok).toEqual(false);
});
