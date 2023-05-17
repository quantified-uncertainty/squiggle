import { SqProject } from "../../src/index.js";
import { toStringResult } from "../../src/public/SqValue.js";

describe("SqProject Tutorial", () => {
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
       * `getDependencies` does not distinguish between `setContinues` or `parseImports`.
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

    describe("Real Like", () => {
      /* Now let's look at recursive and possibly cyclic imports */
      /* There is no function provided to load the import files.
    Because we have no idea if will it be an ordinary function or will it use promises.
    Therefore one has to write a function to load sources recursively and and setSources
    while checking for dependencies */

      /* Let's make a dummy loader */
      let loadSource = (sourceName: string): string => {
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

      /* let's recursively load the sources */
      const loadImportsRecursively = (
        project: SqProject,
        initialSourceName: string
      ) => {
        const visited = new Set<string>();
        const inner = (sourceName: string) => {
          if (visited.has(sourceName)) {
            /* Oh we have already visited this source. There is an import cycle */
            throw new Error(`Cyclic import ${sourceName}`);
          }
          visited.add(sourceName);
          /* Let's parse the imports and dive into them */
          project.parseImports(sourceName);
          const rImportIds = project.getImportIds(sourceName);
          if (!rImportIds.ok) {
            /* Maybe there is an import syntax error */
            throw new Error(rImportIds.value.toString());
          }

          for (const newImportId of rImportIds.value) {
            /* We have got one of the new imports.
                   Let's load it and add it to the project */
            const newSource = loadSource(newImportId);
            project.setSource(newImportId, newSource);
            /* The new source is loaded and added to the project. */
            /* Of course the new source might have imports too. */
            /* Let's recursively load them */
            loadImportsRecursively(project, newImportId);
          }
        };
        inner(initialSourceName);
      };
      /* As we have a fake source loader and a recursive import handler,
         We can not set up a real project */

      /* * Here starts our real life project! * */

      const project = SqProject.create({ resolver: (name) => name });

      project.setSource(
        "main",
        `
        import "source1" as s1
        import "source2" as s2
        import "source3" as s3
        a = s1.x + s2.y + s3.z
        b = doubleX
        a
        `
      );
      /* Setting source requires parsing and loading the imports recursively */
      loadImportsRecursively(project, "main"); // Not visited yet

      /* Let's salt it more. Let's have another source in the project which also has imports */
      /* doubleX imports source1 which is eventually imported by main as well */
      project.setSource(
        "doubleX",
        `
        import "source1" as s1
        doubleX = s1.x * 2
        `
      );
      loadImportsRecursively(project, "doubleX");
      /* Remember, any time you set a source, you need to load imports recursively */

      /* As doubleX is not imported by main, it is not loaded recursively.
         So we link it to the project as a dependency */
      project.setContinues("main", ["doubleX"]);

      /* Let's run the project */
      project.runAll();
      const result = project.getResult("main");
      const bindings = project.getBindings("main");
      /* And see the result and bindings.. */
      test("recursive imports", () => {
        expect([toStringResult(result), bindings.toString()]).toEqual([
          "Ok(6)",
          "{a: 6,b: 2}",
        ]);
        /* Everything as expected */
      });
    });
  });
});
