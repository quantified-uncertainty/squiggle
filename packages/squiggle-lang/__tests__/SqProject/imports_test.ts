import { SqProject } from "../../src/index.js";
import {
  defaultLinker,
  makeSelfContainedLinker,
} from "../../src/public/SqLinker.js";

describe("Imports", () => {
  describe("Parse imports", () => {
    const linker = defaultLinker;
    const project = new SqProject({ linker });
    project.setSimpleHead(
      "main",
      `
      import './common' as common
      import "./myModule" as myVariable
      x = 1
    `
    );

    test("module.imports()", () => {
      // `module.imports()` always parses the source
      // (Also note how imported sources are missing but that's ok; it doesn't prevent parsing)
      expect(project.getHead("main").getImports(linker)).toMatchObject([
        { variable: "common", name: "./common" },
        { variable: "myVariable", name: "./myModule" },
      ]);
    });
  });

  test("Linker errors", async () => {
    const project = new SqProject();
    project.setSimpleHead(
      "main",
      `
        import './lib' as lib
        123
      `
    );

    const output = await project.waitForOutput("main");

    expect(output.result.ok).toEqual(false);
    expect(output.getEndResult().ok).toEqual(false);
    expect(output.getEndResult().value.toString()).toEqual(
      "Error: Imports are not implemented"
    );
  });

  test("Unknown import", async () => {
    const project = new SqProject({
      linker: makeSelfContainedLinker({}),
    });
    project.setSimpleHead(
      "main",
      `
        import './lib' as lib
        123
      `
    );

    const output = await project.waitForOutput("main");

    const result = output.getEndResult();
    expect(result.ok).toEqual(false);
    if (result.ok) throw "assert";

    expect(result.value.toString()).toEqual(
      "Error: Can't find source with id ./lib"
    );
    expect(result.value.toStringWithDetails()).toEqual(
      `Error: Can't find source with id ./lib
Import chain:
  import ./lib at line 2, column 16, file main`
    );
  });

  test("Nested unknown import", async () => {
    const project = new SqProject({
      linker: makeSelfContainedLinker({
        foo: "import 'bar' as bar\n1",
      }),
    });
    project.setSimpleHead(
      "main",
      `
        import 'foo' as foo
        123
      `
    );

    const output = await project.waitForOutput("main");

    const result = output.getEndResult();
    expect(result.ok).toEqual(false);
    if (result.ok) throw "assert";

    expect(result.value.toString()).toEqual(
      "Error: Can't find source with id bar"
    );
    expect(result.value.toStringWithDetails()).toEqual(
      `Error: Can't find source with id bar
Import chain:
  import bar at line 1, column 8, file foo
  import foo at line 2, column 16, file main`
    );
  });

  test("Known import", async () => {
    const project = new SqProject({
      linker: makeSelfContainedLinker({
        "./lib": "export x = 5",
      }),
    });
    project.setSimpleHead(
      "main",
      `
  import './lib' as lib
  lib`
    );

    const output = await project.waitForOutput("main");

    expect(output.getEndResult().ok).toEqual(true);
    expect(output.getEndResult().value.toString()).toEqual(
      '{x: 5, with tags {exportData: {sourceId:"./lib",path:["x"]}}}, with tags {name: "./lib", exportData: {sourceId:"./lib",path:[]}}'
    );
  });

  test("Circular imports", async () => {
    const project = new SqProject({
      linker: makeSelfContainedLinker({
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
    project.setSimpleHead(
      "main",
      `
          import "foo" as foo
          foo.x
        `
    );

    const output = await project.waitForOutput("main");

    expect(output.getEndResult().ok).toEqual(false);
    if (output.result.ok) throw "assert";

    // expect(output.getEndResult().value.toString()).toEqual(
    //   "Circular import: main -> foo -> bar -> foo"
    // );
    expect(output.result.value.toStringWithDetails()).toEqual(
      `Circular import
Import chain:
  import foo at line 2, column 20, file bar
  import bar at line 2, column 20, file foo
  import foo at line 2, column 18, file main`
    );
  });

  test("Self-import", async () => {
    const linker = makeSelfContainedLinker({
      main: `
          import "main" as self
          self
      `,
    });
    const project = new SqProject({ linker });
    await project.loadHead("main", { moduleName: "main" });

    const output = await project.waitForOutput("main");

    expect(output.result.ok).toEqual(false);
    if (output.result.ok) throw "assert";

    expect(output.result.value.toString()).toEqual("Circular import");
    expect(output.result.value.toStringWithDetails()).toEqual(
      `Circular import
Import chain:
  import main at line 2, column 18, file main`
    );
  });

  test("Diamond shape", async () => {
    const project = new SqProject({
      linker: makeSelfContainedLinker({
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
    project.setSimpleHead(
      "main",
      `
          import "left" as foo
          import "right" as bar
          foo.x + bar.x
        `
    );

    const output = await project.waitForOutput("main");
    const result = output.getEndResult();
    expect(result.ok).toBe(true);
    expect(result.value.toString()).toBe("50");
  });
});
