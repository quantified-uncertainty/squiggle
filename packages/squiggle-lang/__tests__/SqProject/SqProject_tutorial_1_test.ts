import { SqProject, evaluate } from "../../src/public/SqProject";
import { toStringResult } from "../../src/public/SqValue";
import { defaultEnvironment } from "../../src";

describe("ReducerProject Tutorial", () => {
  describe("Single source", () => {
    /*
Case "Running a single source". 
*/
    test("run", () => {
      /* Let's start with running a single source and getting Result as well as the Bindings 
       First you need to create a project. A project is a collection of sources. 
       Project takes care of the dependencies between the sources, correct compilation and run order. 
       You can run any source in the project. It will be compiled and run if it hasn't happened already; otherwise already existing results will be presented.
       The dependencies will be automatically compiled and run. So you don't need to worry about that in a multi source project.
       In summary you issue a run command on the whole project or on a specific source to ensure that there is a result for that source.
 */
      const project = SqProject.create();
      /* Every source has a name. This is used for debugging, dependencies and error messages. */
      project.setSource("main", "1 + 2");
      /* Let's run "main" source. */
      project.run("main");
      /* Now you have a result for "main" source. 
       Running one by one is necessary for UI to navigate among the sources and to see the results by source. 
       And you're free to run any source you want. 
       You will look at the results of this source and you don't want to run the others if not required.
 */

      /* However, you could also run the whole project.
       If you have all the sources, you can always run the whole project. 
       Dependencies and recompiling on demand will be taken care of by the project. 
 */
      project.runAll();

      /* Either with run or runAll you executed the project. 
       You can get the result of a specific source by calling getResult for that source. 
       You can get the bindings of a specific source by calling getBindings for that source. 
       If there is any runtime error, getResult will return the error.

       Note that getResult returns None if the source has not been run.
       Getting None means you have forgotten to run the source.
 */
      const result = project.getResult("main");
      const bindings = project.getBindings("main");

      /* Let's display the result and bindings */
      expect([toStringResult(result), bindings.toString()]).toEqual([
        "Ok(3)",
        "{}",
      ]);
      /* You've got 3 with empty bindings. */
    });

    test("run summary", () => {
      const project = SqProject.create();
      project.setSource("main", "1 + 2");
      project.runAll();
      const result = project.getResult("main");
      const bindings = project.getBindings("main");
      /* Now you have external bindings and external result. */
      expect([toStringResult(result), bindings.toString()]).toEqual([
        "Ok(3)",
        "{}",
      ]);
    });

    test("run with an environment", () => {
      /* Running the source code like above allows you to set a custom environment */
      const project = SqProject.create();

      /* Optional. Set your custom environment anytime before running */
      project.setEnvironment(defaultEnvironment);

      project.setSource("main", "1 + 2");
      project.runAll();
      const result = project.getResult("main");
      const _bindings = project.getBindings("main");
      expect(toStringResult(result)).toBe("Ok(3)");
    });

    test("shortcut", () => {
      /* If you are running single source without includes and you don't need a custom environment, you can use the shortcut. */
      /* Examples above was to prepare you for the multi source tutorial. */
      const [result, bindings] = evaluate("1+2");
      expect([toStringResult(result), bindings.toString()]).toEqual([
        "Ok(3)",
        "{}",
      ]);
    });
  });
});

//TODO multiple sources
//TODO multiple sources with includes. Introduction to includes
//TODO multiple sources with multi level includes. Cycle detection
//TODO
//TODO: Implement a runOrder consideration - clean results based on run order.
//TODO: runOrder vs setSource/touchSource
//TODO: Advanced details: (below)
//TODO  runOrder. includes vs continues. Run order based reexecution
//TODO: dependents and reexecution
//TODO: dependencies and reexecution
//TODO: cleanAllResults clean
//TODO: cleanAll clean
