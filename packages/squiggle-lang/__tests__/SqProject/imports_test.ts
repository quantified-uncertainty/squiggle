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
      expect(project.getHead("main").imports(linker)).toMatchObject([
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

    expect(output.result.ok).toEqual(false);
    expect(output.getEndResult().ok).toEqual(false);
    expect(output.getEndResult().value.toString()).toEqual(
      "Error: Can't find source with id ./lib"
    );
  });

  // test("getParents", () => {
  //   expect(
  //     project.state.getParents(project.getModuleOrThrow("./common"))
  //   ).toEqual(["main"]);
  // });

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

  test("Cyclic imports", async () => {
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
    expect(output.getEndResult().value.toString()).toEqual("Cyclic import foo");
  });

  //   test("Self-import", async () => {
  //     const linker = makeSelfContainedLinker({
  //       main: `
  //         import "main" as self
  //         self
  //     `,
  //     });
  //     const project = new SqProject({ linker });
  //     project.loadHead("main", { moduleName: "main" });

  //     const output = await project.waitForOutput("main");

  //     expect(output.result.ok).toEqual(false);
  //     expect(output.result.value.toString()).toEqual("Cyclic import main");
  //   });

  //   test("Diamond shape", async () => {
  //     const project = new SqProject({
  //       linker: makeSelfContainedLinker({
  //         root: `
  //           export x = 10
  //         `,
  //         left: `
  //           import "root" as root
  //           export x = root.x * 2
  //         `,
  //         right: `
  //           import "root" as root
  //           export x = root.x * 3
  //         `,
  //       }),
  //     });
  //     project.setSimpleHead(
  //       "main",
  //       `
  //         import "left" as foo
  //         import "right" as bar
  //         foo.x + bar.x
  //       `
  //     );

  //     const output = await project.waitForOutput("main");
  //     const result = output.getEndResult();
  //     expect(result.ok).toBe(true);
  //     expect(result.value.toString()).toBe("50");
  // });
});
