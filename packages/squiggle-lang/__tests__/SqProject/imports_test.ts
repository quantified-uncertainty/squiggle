import { SqModule, SqProject } from "../../src/index.js";
import {
  defaultLinker,
  makeSelfContainedLinker,
  SqLinker,
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
      expect(project.getHead("main").getImports(linker)).toMatchObject({
        ok: true,
        value: [
          { variable: "common", name: "./common" },
          { variable: "myVariable", name: "./myModule" },
        ],
      });
    });
  });

  describe("Linker resolve errors", () => {
    // Resolves "./"-prefixed imports and throws for everything else.
    const resolvingLinker = (sources: Record<string, string>): SqLinker => ({
      ...makeSelfContainedLinker(sources),
      resolve: (name) => {
        if (!name.startsWith("./")) {
          throw new Error(`Can't resolve ${name}`);
        }
        return name;
      },
    });

    test("getImports reports every unresolvable import", () => {
      const module = new SqModule({
        name: "main",
        code: `import "./ok" as ok\nimport "bad1" as b1\nimport "bad2" as b2\n1`,
      });
      const imports = module.getImports(resolvingLinker({}));
      if (imports.ok) throw "assert";
      expect(imports.value.errors.map((e) => e.toString())).toEqual([
        "Error: Can't resolve bad1",
        "Error: Can't resolve bad2",
      ]);
      const [error] = imports.value.errors;
      if (error.tag !== "import") throw "assert";
      expect(error.location()).toMatchObject({
        source: "main",
        start: { line: 2, column: 8 },
      });
    });

    test("in the root module", async () => {
      const project = new SqProject({ linker: resolvingLinker({}) });
      expect(() =>
        project.setSimpleHead(
          "main",
          `import "./ok" as ok\nimport "bad" as bad\nbad`
        )
      ).not.toThrow();

      const output = await project.waitForOutput("main");

      if (output.result.ok) throw "assert";
      expect(output.result.value.toString()).toEqual(
        "Error: Can't resolve bad"
      );
      const [error] = output.result.value.errors;
      if (error.tag !== "import") throw "assert";
      expect(error.location()).toMatchObject({
        source: "main",
        start: { line: 2, column: 8 },
      });
      expect(output.result.value.toStringWithDetails()).toEqual(
        `Error: Can't resolve bad
Import chain:
  import bad at line 2, column 8, file main`
      );
    });

    test("in a nested import", async () => {
      const project = new SqProject({
        linker: resolvingLinker({
          "./foo": `import "bad" as bad\nexport x = 1`,
        }),
      });
      expect(() =>
        project.setSimpleHead("main", `import "./foo" as foo\nfoo.x`)
      ).not.toThrow();

      const output = await project.waitForOutput("main");

      if (output.result.ok) throw "assert";
      expect(output.result.value.toString()).toEqual(
        "Error: Can't resolve bad"
      );
      expect(output.result.value.toStringWithDetails()).toEqual(
        `Error: Can't resolve bad
Import chain:
  import bad at line 1, column 8, file ./foo
  import ./foo at line 1, column 8, file main`
      );
    });

    test("project recovers when the import is fixed", async () => {
      const project = new SqProject({
        linker: resolvingLinker({ "./lib": "export x = 5" }),
      });
      project.setSimpleHead("main", `import "lib" as lib\nlib.x * 2`);
      expect((await project.waitForOutput("main")).result.ok).toBe(false);

      project.setSimpleHead("main", `import "./lib" as lib\nlib.x * 2`);
      const output = await project.waitForOutput("main");
      expect(output.getEndResult().ok).toBe(true);
      expect(output.getEndResult().value.toString()).toBe("10");
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

  test("Compile-time error in import", async () => {
    const linker = makeSelfContainedLinker({
      foo: `x = 1 + ""`,
      main: `
          import "foo" as foo
          foo.x
      `,
    });
    const project = new SqProject({ linker });
    await project.loadHead("main", { moduleName: "main" });

    const output = await project.waitForOutput("main");

    expect(output.result.ok).toEqual(false);
    if (output.result.ok) throw "assert";

    expect(output.result.value.toString()).toEqual(
      "Operator '+' does not support types 'Number' and 'String'"
    );
    expect(output.result.value.toStringWithDetails())
      .toEqual(`Operator '+' does not support types 'Number' and 'String'
Location:
  at line 1, column 5, file foo
Import chain:
  import foo at line 2, column 18, file main`);
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
