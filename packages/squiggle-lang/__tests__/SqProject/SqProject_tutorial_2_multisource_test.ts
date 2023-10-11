import { SqProject } from "../../src/index.js";
import "../helpers/toBeOkOutput.js";

describe("Multi source SqProject", () => {
  /**
   * Running multiple sources.
   * This approach uses `setContinues`, which is useful in Observable and other notebook-like environments,
   * where the code is divided into multiple cells, but there are no explicit `import` statements.
   */
  test("Chaining", async () => {
    const project = SqProject.create();

    /* This time let's add 3 sources and chain them together */
    project.setSource("source1", "x=1");

    project.setSource("source2", "y=x+1");
    /* To run, source2 depends on source1 */
    project.setContinues("source2", ["source1"]);

    project.setSource("source3", "z=y+1");
    /* To run, source3 depends on source2 */
    project.setContinues("source3", ["source2"]);

    /* Now we can run the project */
    await project.runAll();

    /* And let's check the result and bindings of source3 */
    const output = project.getOutput("source3");
    expect(output).toBeOkOutput("()", "{z: 3}");
  });

  test("Depending", async () => {
    /* Instead of chaining the sources, we could have a dependency tree. */
    /* The point here is that any source can depend on multiple sources. */
    const project = SqProject.create();

    /* This time source1 and source2 are not depending on anything */
    project.setSource("source1", "x=1");
    project.setSource("source2", "y=2");

    project.setSource("source3", "z=x+y");
    /* To run, source3 depends on source1 and source3 together */
    project.setContinues("source3", ["source1", "source2"]);

    /* Now we can run the project */
    await project.runAll();

    /* And let's check the result and bindings of source3 */
    const output = project.getOutput("source3");
    expect(output).toBeOkOutput("()", "{z: 3}");
  });

  test("Intro to imports", async () => {
    /**
     * Let's write the same project above with imports.
     * You will see that parsing imports is setting the dependencies the same way as before.
     */
    const project = SqProject.create({
      linker: {
        resolve: (name) => name,
        loadSource: () => {
          throw new Error("Loading not supported");
        },
      },
    });

    /* This time source1 and source2 are not depending on anything */
    project.setSource("source1", "x=1");

    project.setSource(
      "source3",
      `
      import "source1" as s1
      import "source2" as s2
      z=s1.x+s2.y`
    );
    /* We're creating source1, source2, source3 in a weird order to check that `runAll` loads imports on demand */
    project.setSource("source2", "y=2");

    /* Now we can run the project */
    await project.runAll();

    /* And let's check the result and bindings of source3 */
    const output = project.getOutput("source3");

    expect(output).toBeOkOutput("()", "{z: 3}");
    /*
     * Dealing with imports needs more.
     * - There are parse errors
     * - There are cyclic imports
     * - And the depended source1 and source2 is not already there in the project
     * - If you knew the imports before hand there would not be point of the imports directive.
     * More on those on the next section.
     */
  });
});
