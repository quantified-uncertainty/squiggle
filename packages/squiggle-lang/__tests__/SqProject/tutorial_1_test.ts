import "../helpers/toBeOkOutput.js";

import { defaultEnvironment, run } from "../../src/index.js";
import { SqProject } from "../../src/public/SqProject/index.js";
import { valueResultToString } from "../helpers/projectHelpers.js";

describe("Single source SqProject", () => {
  test("run", async () => {
    /**
     * Let's start with running a single module and getting Result as well as
     * the Bindings.
     *
     * First you need to create a project. A project is a collection of modules.
     *
     * Project takes care of the dependencies between the modules, correct
     * compilation and run order.
     *
     * You interact with the project by adding "heads" to it; heads are named
     * pointers to the modules that serve as entrypoints.
     *
     * The dependencies will be automatically compiled and run. So you don't
     * need to worry about that if your modules have import statements.
     */
    const project = new SqProject();

    /**
     * Every head has a name.
     *
     * Head name is not the same thing as the module name; think "git branch" vs
     * "file name".
     *
     * `setSimpleHead` will use the same name for both, though: the following
     * line will add the "main" head pointing to SqModule with the name "main".
     */
    project.setSimpleHead("main", "1 + 2");

    /* Let's run "main" source. */
    /*
     * After the head it added, the project will automatically run it, and eventually its output will appear.
     * You can wait for the output with `waitForOutput`, or you can add an event listener to the project and filter the output events manually.
     * You can get the bindings of a specific source by calling `getBindings` for that source.
     * To get both, call `getOutput`.
     * If there is any runtime error, these functions will return the error result.
     */
    const output = await project.waitForOutput("main"); // Output is a SqModuleOutput object

    /* Let's display the result and bindings. */
    expect(output.result).toBeOkOutput("3", "{}");
    /* You've got 3 with empty bindings. */
  });

  test("run with an environment", async () => {
    /* Running the source code like above allows you to set a custom environment */
    const project = new SqProject({
      environment: {
        ...defaultEnvironment,
        sampleCount: 50,
      },
    });

    project.setSimpleHead(
      "main",
      "(2 to 5) -> SampleSet.toList -> List.length"
    );

    const output = await project.waitForOutput("main");
    expect(valueResultToString(output.getEndResult())).toBe("Ok(50)");
  });

  test("shortcut", async () => {
    /*
     * If you are running a single source without imports, you can use the shortcut.
     * Examples above were to prepare you for the multi source tutorial.
     */
    const output = await run("1+2");
    expect(output.result.ok).toBe(true);

    if (!output.result.ok) {
      throw new Error("failed");
    }

    expect(output.result).toBeOkOutput("3", "{}");
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
