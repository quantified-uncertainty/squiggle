import { defaultEnvironment, run } from "../../src/index.js";
import { SqProject } from "../../src/public/SqProject/index.js";
import { toStringResult } from "../../src/public/SqValue/index.js";
import "../helpers/toBeOkOutput.js";

describe("Single source SqProject", () => {
  test("run", async () => {
    /*
     * Let's start with running a single source and getting Result as well as the Bindings.
     * First you need to create a project. A project is a collection of sources.
     * Project takes care of the dependencies between the sources, correct compilation and run order.
     * You can run any source in the project. It will be compiled and run if it hasn't happened already; otherwise already existing results will be presented.
     * The dependencies will be automatically compiled and run. So you don't need to worry about that in a multi source project.
     * In summary you issue a run command on the whole project or on a specific source to ensure that there is a result for that source.
     */
    const project = SqProject.create();
    /* Every source has a name. This is used for debugging, dependencies and error messages. */
    project.setSource("main", "1 + 2");

    /* Let's run "main" source. */
    await project.run("main");
    /*
     * Now you have a result for "main" source.
     * Running one by one is necessary for UI to navigate among the sources and to see the results by source.
     * And you're free to run any source you want.
     * You will look at the results of this source and you don't have to run the others if not required.
     */

    /*
     * With `run` you executed a source.
     * You can get the result of a specific source by calling `getResult` for that source.
     * You can get the bindings of a specific source by calling `getBindings` for that source.
     * To get both, call `getOutput`.
     * If there is any runtime error, these functions will return the error result.
     */
    const output = project.getOutput("main");
    /* Output is a `result<{ result: SqValue, bindings: SqDict }, SqError>` */

    /* Let's display the result and bindings. */
    expect(output).toBeOkOutput("3", "{}");
    /* You've got 3 with empty bindings. */
  });

  test("run with an environment", async () => {
    /* Running the source code like above allows you to set a custom environment */
    const project = SqProject.create({
      environment: {
        ...defaultEnvironment,
        sampleCount: 50,
      },
    });

    project.setSource("main", "(2 to 5) -> SampleSet.toList -> List.length");
    await project.run("main");
    const result = project.getResult("main");
    expect(toStringResult(result)).toBe("Ok(50)");
  });

  test("shortcut", async () => {
    /*
     * If you are running a single source without imports, you can use the shortcut.
     * Examples above were to prepare you for the multi source tutorial.
     */
    const outputR = await run("1+2");
    expect(outputR.ok).toBe(true);

    if (!outputR.ok) {
      throw new Error("failed");
    }

    expect(outputR).toBeOkOutput("3", "{}");
  });
});

/*
 * TODO: Multiple sources with multi level imports. Cycle detection.
 * TODO: Implement a runOrder consideration - clean results based on run order.
 * TODO: runOrder vs setSource/touchSource.
 * TODO: Advanced details: (below).
 * TODO: runOrder. imports vs continues. Run order based reexecution.
 * TODO: Dependents and reexecution.
 * TODO: Dependencies and reexecution.
 * TODO: cleanAll, clean.
 */
