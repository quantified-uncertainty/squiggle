import { SqProject } from "../../src/index.js";
import { toStringResult } from "../../src/public/SqValue.js";

/**
 * Case: Imports.
 * In the previous tutorial we have set the similarity between setContinues and parseImports.
 * Here we will finally proceed to a real life scenario
 */

describe("parseImports", () => {
  /**
   * Here we investigate the details about parseImports, before setting up a real life scenario in the next section.
   * Everything happens inside a project, so let's have a project.
   */
  const project = SqProject.create({
    resolver: (name) => name,
  });
  project.setSource(
    "main",
    `
    import "./common" as common
    x=1
    `
  );
  /* We need to parse imports after changing the source */
  project.parseImports("main");

  test("getDependencies", () => {
    /* Parse imports has set the dependencies */
    expect(project.getDependencies("main")).toEqual(["./common"]);
    /**
     * If there were no imports than there would be no dependencies.
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
      fail(importIds.value.toString());
    }
    /**
     * If the imports cannot be parsed then you get a syntax error.
     * Otherwise you get the imports.
     * If there is no syntax error then you can load that file and use setSource to add it to the project.
     * And so on recursively...
     */
  });

  test("getDependents", () => {
    /* For any reason, you are able to query what other sources
        import or depend on the current source.
        But you don't need to use this to execute the projects.
        It is provided for completeness of information. */
    expect(project.getDependents("main")).toEqual([]);
    /* Nothing is depending on or including main */
  });
});

/*
 * Now let's look at recursive and possibly cyclic imports.
 * There is no function provided to load the import files.
 * Because we have no idea if will it be an ordinary function or will it use promises.
 * Therefore one has to provide a function to load sources.
 */
describe("Recursive imports", () => {
  /* Let's make a dummy loader */
  const loadSource = async (sourceName: string): Promise<string> => {
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
  };

  const mainSource = `
    import "source1" as s1
    import "source2" as s2
    import "source3" as s3
    a = s1.x + s2.y + s3.z
    b = doubleX
    a
  `;

  const doubleXSource = `
    import "source1" as s1
    doubleX = s1.x * 2
  `;

  /* First possible approach is to pre-load imports with loadImportsRecursively, and then use project.run() */
  test("explicit loadImportsRecursively", async () => {
    const project = SqProject.create({ resolver: (name) => name });

    project.setSource("main", mainSource);
    /* Setting source requires parsing and loading the imports recursively */
    await project.loadImportsRecursively("main", loadSource); // Not visited yet

    /* Let's salt it more. Let's have another source in the project which also has imports */
    /* doubleX imports source1 which is eventually imported by main as well */
    project.setSource("doubleX", doubleXSource);
    await project.loadImportsRecursively("doubleX", loadSource);
    /* Remember, any time you set a source, you need to load imports recursively */

    /* As doubleX is not imported by main, it is not loaded recursively.
         So we link it to the project as a dependency */
    project.setContinues("main", ["doubleX"]);

    /* Let's run the project */
    await project.runAll();
    const result = project.getResult("main");
    const bindings = project.getBindings("main");

    /* And see the result and bindings.. */
    expect([toStringResult(result), bindings.toString()]).toEqual([
      "Ok(6)",
      "{a: 6,b: 2}",
    ]);
    /* Everything as expected */
  });

  /* Second approach is to use async runWithImports method; this is recommended */
  test("runWithImports", async () => {
    const project = SqProject.create({ resolver: (name) => name });

    project.setSource("main", mainSource);
    project.setSource("doubleX", doubleXSource);

    project.setContinues("main", ["doubleX"]);

    /* Let's run the project; this method will load imports recursively for you */
    await project.runWithImports("main", loadSource);

    const result = project.getResult("main");
    const bindings = project.getBindings("main");

    expect([toStringResult(result), bindings.toString()]).toEqual([
      "Ok(6)",
      "{a: 6,b: 2}",
    ]);
  });
});
