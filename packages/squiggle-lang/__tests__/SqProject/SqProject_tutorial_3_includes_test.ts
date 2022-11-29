import { SqProject } from "../../src";
import { toStringResult } from "../../src/public/SqValue";

describe("ReducerProject Tutorial", () => {
  /* Case: Includes
In the previous tutorial we have set the similarity between setContinues and parseIncludes.
Here we will finally proceed to a real life scenario. */

  describe("parseIncludes", () => {
    /* Here we investigate the details about parseIncludes, before setting up a real life scenario in the next section. */
    /* Everything happens inside a project, so let's have a project */
    const project = SqProject.create({
      resolver: (name) => name,
    });
    project.setSource(
      "main",
      `
    #include "common"
    x=1
    `
    );
    /* We need to parse includes after changing the source */
    project.parseIncludes("main");
    test("getDependencies", () => {
      /* Parse includes has set the dependencies */
      expect(project.getDependencies("main")).toEqual(["common"]);
      /* If there were no includes than there would be no dependencies */
      /* However if there was a syntax error at includes then would be no dependencies also */
      /* Therefore looking at dependencies is not the right way to load includes */
      /* getDependencies does not distinguish between setContinues or parseIncludes */
    });
    test("getIncludes", () => {
      /* Parse includes has set the includes */
      const includes = project.getIncludes("main");
      if (includes.ok) {
        expect(includes.value).toEqual(["common"]);
      } else {
        fail(includes.value.toString());
      }
      /* If the includes cannot be parsed then you get a syntax error.
      Otherwise you get the includes.
      If there is no syntax error then you can load that file and use setSource to add it to the project.
      And so on recursively... */
    });
    test("getDependents", () => {
      /* For any reason, you are able to query what other sources
        include or depend on the current source.
        But you don't need to use this to execute the projects.
        It is provided for completeness of information. */
      expect(project.getDependents("main")).toEqual([]);
      /* Nothing is depending on or including main */
    });

    describe("Real Like", () => {
      /* Now let's look at recursive and possibly cyclic includes */
      /* There is no function provided to load the include files.
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
            #include "source1"
            y=2`;
          case "source3":
            return `
            #include "source2"
            z=3`;
          default:
            throw new Error(`source ${sourceName} not found`);
        }
      };

      /* let's recursively load the sources */
      const loadIncludesRecursively = (
        project: SqProject,
        initialSourceName: string
      ) => {
        const visited = new Set<string>();
        const inner = (sourceName: string) => {
          if (visited.has(sourceName)) {
            /* Oh we have already visited this source. There is an include cycle */
            throw new Error(`Cyclic include ${sourceName}`);
          }
          visited.add(sourceName);
          /* Let's parse the includes and dive into them */
          project.parseIncludes(sourceName);
          const rIncludes = project.getIncludes(sourceName);
          if (!rIncludes.ok) {
            /* Maybe there is an include syntax error */
            throw new Error(rIncludes.value.toString());
          }

          for (const newIncludeName of rIncludes.value) {
            /* We have got one of the new includes.
                   Let's load it and add it to the project */
            let newSource = loadSource(newIncludeName);
            project.setSource(newIncludeName, newSource);
            /* The new source is loaded and added to the project. */
            /* Of course the new source might have includes too. */
            /* Let's recursively load them */
            loadIncludesRecursively(project, newIncludeName);
          }
        };
        inner(initialSourceName);
      };
      /* As we have a fake source loader and a recursive include handler,
         We can not set up a real project */

      /* * Here starts our real life project! * */

      const project = SqProject.create({ resolver: (name) => name });

      project.setSource(
        "main",
        `
        #include "source1"
        #include "source2"
        #include "source3"
        a = x+y+z
        b = doubleX
        a
        `
      );
      /* Setting source requires parsing and loading the includes recursively */
      loadIncludesRecursively(project, "main"); // Not visited yet

      /* Let's salt it more. Let's have another source in the project which also has includes */
      /* doubleX includes source1 which is eventually included by main as well */
      project.setSource(
        "doubleX",
        `
        #include "source1"
        doubleX = x * 2
        `
      );
      loadIncludesRecursively(project, "doubleX");
      /* Remember, any time you set a source, you need to load includes recursively */

      /* As doubleX is not included by main, it is not loaded recursively.
         So we link it to the project as a dependency */
      project.setContinues("main", ["doubleX"]);

      /* Let's run the project */
      project.runAll();
      const result = project.getResult("main");
      const bindings = project.getBindings("main");
      /* And see the result and bindings.. */
      test("recursive includes", () => {
        expect([toStringResult(result), bindings.toString()]).toEqual([
          "Ok(6)",
          "{a: 6,b: 2}",
        ]);
        /* Everything as expected */
      });
    });
  });

  describe("Includes myFile as myVariable", () => {
    /* Instead of including into global space you can also put a module into a record variable */
    const project = SqProject.create({ resolver: (name) => name });
    project.setSource(
      "main",
      `
    #include "common" as common
    x=1
    `
    );
    project.parseIncludes("main");
    test("getDependencies", () => {
      expect(project.getDependencies("main")).toEqual(["common"]);
    });
    test("getIncludes", () => {
      const includes = project.getIncludes("main");
      if (includes.ok) {
        expect(includes.value).toEqual(["common"]);
      } else {
        fail(includes.value.toString());
      }
    });
  });
});
