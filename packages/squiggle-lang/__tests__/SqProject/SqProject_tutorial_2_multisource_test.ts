import { SqProject } from "../../src/index.js";
import { toStringResult } from "../../src/public/SqValue.js";

describe("SqProject Tutorial", () => {
  describe("Multi source", () => {
    /**
     * Running multiple sources.
     * This approach uses `setContinues`, which is useful in Observable and other notebook-like environments.
     */
    test("Chaining", () => {
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
      project.runAll();

      /* And let's check the result and bindings of source3 */
      const result3 = project.getResult("source3");
      let bindings3 = project.getBindings("source3");

      expect(toStringResult(result3)).toBe("Ok(())");
      expect(bindings3.toString()).toBe("{z: 3}");
    });

    test("Depending", () => {
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
      project.runAll();

      /* And let's check the result and bindings of source3 */
      const result3 = project.getResult("source3");
      const bindings3 = project.getBindings("source3");

      expect(toStringResult(result3)).toBe("Ok(())");
      expect(bindings3.toString()).toBe("{z: 3}");
    });

    test("Intro to imports", () => {
      /**
       * Let's write the same project above with imports.
       * You will see that parsing imports is setting the dependencies the same way as before.
       */
      const project = SqProject.create({ resolver: (name) => name });

      /* This time source1 and source2 are not depending on anything */
      project.setSource("source1", "x=1");
      project.setSource("source2", "y=2");

      project.setSource(
        "source3",
        `
      import "source1" as s1
      import "source2" as s2
      z=s1.x+s2.y`
      );
      /* We need to parse the imports to set the dependencies */
      project.parseImports("source3");

      /* Now we can run the project */
      project.runAll();

      /* And let's check the result and bindings of source3 
      This time you are getting all the variables because we are including the other sources 
      Behind the scenes parseImports is setting the dependencies */
      const result3 = project.getResult("source3");
      const bindings3 = project.getBindings("source3");

      expect(toStringResult(result3)).toBe("Ok(())");
      expect(bindings3.toString()).toBe("{z: 3}");
      /*
         Dealing with imports needs more. 
         - There are parse errors
         - There are cyclic imports
         - And the depended source1 and source2 is not already there in the project
         - If you knew the imports before hand there would not be point of the imports directive.
         More on those on the next section. */
    });
  });
});
