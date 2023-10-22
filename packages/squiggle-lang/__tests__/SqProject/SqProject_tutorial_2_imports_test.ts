import { SqProject } from "../../src/index.js";
import { SqLinker } from "../../src/public/SqLinker.js";
import "../helpers/toBeOkOutput.js";

/*
 * Now let's look at explicit imports, possibly recursive and cyclic.
 */
describe("SqProject with imports", () => {
  test("Preloaded sources", async () => {
    /*
     * Any project that uses sources with import statements needs a basic linker.
     * Linkers are responsible for two things:
     * 1. Converting a string name in `import "name"` to the source id.
     * 2. Loading a source by its id.
     */
    const project = SqProject.create({
      linker: {
        /*
         * Basic import syntax: `import "foo" as foo`.
         * This method is responsible for resolving "foo" string to the source id.
         * That's important, for example, for relative imports: "./foo" from root of the project and "../foo" from "./subfolder" should resolve to the same id.
         */
        resolve: (name) => name, // we don't care for relative imports yet
        loadSource: () => {
          throw new Error("Loading not supported"); // this is ok because we're going to set all sources explicitly
        },
      },
    });

    /* This time source1 and source2 are not depending on anything */
    project.setSource("source1", "export x=1");

    project.setSource(
      "source3",
      `
      import "source1" as s1
      import "source2" as s2
      z=s1.x+s2.y`
    );
    /* We're creating source1, source2, source3 in a weird order to check that `run` loads imports on demand */
    project.setSource("source2", "export y=2");

    /* Now we can run the project */
    await project.run("source3");

    /* And let's check the result and bindings of source3 */
    const output = project.getOutput("source3");

    expect(output).toBeOkOutput("()", "{z: 3}");
  });

  test("Loading sources on demand", async () => {
    const linker: SqLinker = {
      resolve: (name) => name,
      loadSource: async (sourceName) => {
        // Note how this function is async and can load sources remotely on demand.
        switch (sourceName) {
          case "source1":
            return "export x=1";
          case "source2":
            return `
              import "source1" as s1
              export y=2
            `;
          case "source3":
            return `
              import "source2" as s2
              export z=3
            `;
          default:
            throw new Error(`source ${sourceName} not found`);
        }
      },
    };

    const project = SqProject.create({ linker });

    project.setSource(
      "main",
      `
      import "source1" as s1
      import "source2" as s2
      import "source3" as s3
      a = s1.x + s2.y + s3.z
      b = doubleX // available through continues
      a
    `
    );

    /*
     * Let's salt it more. Let's have another source in the project which also has imports.
     * "doubleX" imports "source1" which is eventually imported by "main" as well.
     */
    project.setSource(
      "doubleX",
      `
      import "source1" as s1
      doubleX = s1.x * 2
    `
    );

    /*
     * As doubleX is not imported by main, it is not loaded recursively.
     * So we link it to the project as a dependency.
     */
    project.setContinues("main", ["doubleX"]);

    /* Let's run the project; this method will load imports recursively for you. */
    await project.run("main");

    const output = project.getOutput("main");

    expect(output).toBeOkOutput("6", "{a: 6,b: 2}");

    /* `getDependencies` returns the list of all dependency ids for a given source id, both continues and imports. */
    expect(project.getDependencies("main")).toEqual([
      "doubleX",
      "source1",
      "source2",
      "source3",
    ]);

    /*
     * For any reason, you are able to query what other sources import or depend on the current source.
     * But you don't need to use this to execute the projects.
     * It is provided for completeness of information.
     */
    expect(project.getDependents("source1")).toEqual([
      "main",
      "doubleX",
      "source2",
    ]);
  });
});
