import { SqProject } from "../../src/index.js";
import "../helpers/toBeOkOutput.js";

/*
 * In the previous tutorial we've used explicit import statements; now we'll try implicit imports with `setContinues`,
 * This approach uses `setContinues`, which is useful in Observable and other notebook-like environments,
 * where the code is divided into multiple cells, but there are no explicit `import` statements.
 */
describe("SqProject with continues", () => {
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

    /* Now we can run any source */
    await project.run("source3");

    /* And let's check the result and bindings */
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
    await project.run("source3");

    /* And let's check the result and bindings */
    const output = project.getOutput("source3");
    expect(output).toBeOkOutput("()", "{z: 3}");
  });
});
