import { SqProject } from "../../src/index.js";
import { Resolver } from "../../src/public/SqProject/Resolver.js";
import "../helpers/toBeOkOutput.js";

/*
 * Now let's look at explicit imports, possibly recursive and cyclic.
 * In the previous tutorial we've used `setContinues` manually; now we'll rely on import statements in Squiggle to load the dependencies.
 */
describe("SqProject with imports", () => {
  /*
   * Let's make a simple resolver. Resolvers are responsible for two things:
   * 1. Converting a string name in `import "name"` to the source id (this is useful in some cases, e.g. for normalizing "../dir/file.squiggle" paths).
   * 2. Loading a source by its id.
   */
  const resolver: Resolver = {
    resolve: (name) => name,
    loadSource: async (sourceName) => {
      switch (sourceName) {
        case "source1":
          return "x=1";
        case "source2":
          return `
            import "source1" as s1
            y=2`;
        case "source3":
          return `
            import "source2" as s2
            z=3`;
        default:
          throw new Error(`source ${sourceName} not found`);
      }
    },
  };

  const mainSource = `
    import "source1" as s1
    import "source2" as s2
    import "source3" as s3
    a = s1.x + s2.y + s3.z
    b = doubleX // available through continues
    a
  `;

  const doubleXSource = `
    import "source1" as s1
    doubleX = s1.x * 2
  `;

  /* Basic approach is to call `run`; it's async and will load everything implicitly through the resolver. */
  test("run", async () => {
    const project = SqProject.create({ resolver });

    project.setSource("main", mainSource);

    /*
     * Let's salt it more. Let's have another source in the project which also has imports.
     * "doubleX" imports "source1" which is eventually imported by "main" as well.
     */
    project.setSource("doubleX", doubleXSource);

    /*
     * As doubleX is not imported by main, it is not loaded recursively.
     * So we link it to the project as a dependency.
     */
    project.setContinues("main", ["doubleX"]);

    /* Let's run the project; this method will load imports recursively for you. */
    await project.run("main");

    const output = project.getOutput("main");

    expect(output).toBeOkOutput("6", "{a: 6,b: 2}");
  });

  test("explicit loadImportsRecursively", async () => {
    const project = SqProject.create({ resolver });

    project.setSource("main", mainSource);
    /*
     * Imports will be processed on the first attempt to run, but you can also pre-process them manually without running the source.
     * Notice that `doubleX` in "main" source is not available yet, but that's fine because `loadImportsRecursively` only looks at import statements.
     * Source code must be syntactically correct, though.
     */
    await project.loadImportsRecursively("main");

    project.setSource("doubleX", doubleXSource);
    await project.loadImportsRecursively("doubleX");

    project.setContinues("main", ["doubleX"]);

    /* Let's run the project */
    await project.runAll();
    const output = project.getOutput("main");

    /* And see the result and bindings.. */
    expect(output).toBeOkOutput("6", "{a: 6,b: 2}");
    /* Everything as expected */
  });
});

describe("parseImports", () => {
  /**
   * Let's look at the details of how you can analyze the imports of each source.
   */
  const project = SqProject.create({
    resolver: {
      resolve: (name) => name,
      loadSource: () => {
        throw new Error("loading not implemented");
      },
    },
  });
  project.setSource(
    "main",
    `
    import "./common" as common
    x=1
    `
  );

  /*
   * Parse import statements - this method is also used by `loadSourcesRecursively`,
   * so if you've ever called or or ran your source, imports should be already parsed.
   */
  project.parseImports("main");

  test("getDependencies", () => {
    /* Parse imports has set the dependencies. */
    expect(project.getDependencies("main")).toEqual(["./common"]);
    /*
     * If there were no imports then there would be no dependencies.
     * However if there was a syntax error at imports then would be no dependencies also.
     * Therefore looking at dependencies is not the right way to load imports.
     * `getDependencies` does not distinguish between `setContinues` and explicit import statements.
     */
  });

  test("getImports", () => {
    /* Parse imports has set the imports */
    const importIds = project.getImportIds("main");
    if (importIds.ok) {
      expect(importIds.value).toEqual(["./common"]);
    } else {
      throw new Error(importIds.value.toString());
    }
    /**
     * If the imports cannot be parsed then you get a syntax error.
     * Otherwise you get the imports.
     * If there is no syntax error then you can load that file and use setSource to add it to the project.
     * And so on recursively...
     */
  });

  test("getDependents", () => {
    /*
     * For any reason, you are able to query what other sources import or depend on the current source.
     * But you don't need to use this to execute the projects.
     * It is provided for completeness of information.
     */
    expect(project.getDependents("main")).toEqual([]);
    /* Nothing is depending on or including main */
  });
});
