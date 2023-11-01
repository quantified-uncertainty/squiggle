import { SqProject } from "../../src/index.js";
import {
  buildNaiveLinker,
  runFetchBindings,
  runFetchResult,
} from "../helpers/projectHelpers.js";

describe("Imports", () => {
  describe("Parse imports", () => {
    const project = SqProject.create({ linker: buildNaiveLinker() });
    project.setSource(
      "main",
      `
      import './common' as common
      import "./myModule" as myVariable
      x = 1
    `
    );

    test("getDependencies", () => {
      // `getDependencies` always parses the source
      // (Also note how imported sources are missing but that's ok because they're not needed yet)
      expect(project.getDependencies("main")).toEqual([
        "./common",
        "./myModule",
      ]);
    });

    test("getDependents", () => {
      expect(project.getDependents("./common")).toEqual(["main"]);
    });
    test("getImportIds", () => {
      const mainImportIds = project.getImportIds("main");
      if (mainImportIds.ok) {
        expect(mainImportIds.value).toEqual(["./common", "./myModule"]);
      } else {
        throw new Error(mainImportIds.value.toString());
      }
    });

    test("getImports", () => {
      expect(project.getImports("main")).toEqual({
        ok: true,
        value: [
          { type: "named", variable: "common", sourceId: "./common" },
          { type: "named", variable: "myVariable", sourceId: "./myModule" },
        ],
      });
    });

    test("continues", () => {
      expect(project.getContinues("main")).toEqual([]);
    });
  });

  test("Without linker", async () => {
    const project = SqProject.create();
    project.setSource(
      "main",
      `
        import './lib' as lib
        123
      `
    );

    await project.run("main");

    expect(project.getResult("main").ok).toEqual(false);
  });

  test("Unknown import", async () => {
    const project = SqProject.create({ linker: buildNaiveLinker() });
    project.setSource(
      "main",
      `
import './lib' as lib
lib.x`
    );

    await project.run("main");
    expect(project.getResult("main").ok).toEqual(false);
    expect(project.getResult("main").value.toString()).toEqual(
      "Failed to load import ./lib"
    );
  });

  test("Known import", async () => {
    const project = SqProject.create({
      linker: buildNaiveLinker({
        "./lib": "export x = 5",
      }),
    });
    project.setSource(
      "main",
      `
import './lib' as lib
lib.x`
    );

    await project.run("main");

    expect(project.getResult("main").ok).toEqual(true);
    expect(project.getResult("main").value.toString()).toEqual("5");
  });

  describe("Mix imports and continues", () => {
    const project = SqProject.create({
      linker: buildNaiveLinker(),
    });

    project.setSource(
      "first",
      `
      import 'common' as common
      x = 1
    `
    );
    expect(project.getDependencies("first")).toEqual(["common"]);

    project.setSource("common", "export common = 0");
    project.setSource(
      "second",
      `
      import 'common' as common
      y = 2
    `
    );
    project.setContinues("second", ["first"]);
    expect(project.getDependencies("second")).toEqual(["first", "common"]);

    project.setSource("main", "z=3; y");
    project.setContinues("main", ["second"]);

    test("test result", async () => {
      expect(await runFetchResult(project, "main")).toBe("Ok(2)");
    });
    test("test bindings", async () => {
      // bindings from continues are not exposed!
      expect(await runFetchBindings(project, "main")).toBe("{z: 3}");
    });
  });

  test("Cyclic imports", async () => {
    const project = SqProject.create({
      linker: buildNaiveLinker({
        bar: `
          import "foo" as foo
          y = 6
        `,
        foo: `
          import "bar" as bar
          x = 5
        `,
      }),
    });
    project.setSource(
      "main",
      `
        import "foo" as foo
        foo.x
      `
    );

    await project.run("main");

    expect(project.getResult("main").ok).toEqual(false);
    expect(project.getResult("main").value.toString()).toEqual(
      "Cyclic import foo"
    );
  });

  test("Self-import", async () => {
    const project = SqProject.create({
      linker: buildNaiveLinker(),
    });
    project.setSource(
      "main",
      `
        import "main" as self
        self
      `
    );

    await project.run("main");

    expect(project.getResult("main").ok).toEqual(false);
    expect(project.getResult("main").value.toString()).toEqual(
      "Cyclic import main"
    );
  });

  test("Diamond shape", async () => {
    const project = SqProject.create({
      linker: buildNaiveLinker({
        root: `
          export x = 10
        `,
        left: `
          import "root" as root
          export x = root.x * 2
        `,
        right: `
          import "root" as root
          export x = root.x * 3
        `,
      }),
    });
    project.setSource(
      "main",
      `
        import "left" as foo
        import "right" as bar
        foo.x + bar.x
      `
    );

    await project.run("main");
    expect(project.getResult("main").ok).toBe(true);
    expect(project.getResult("main").value.toString()).toBe("50");
  });
});
