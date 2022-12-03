import { SqProject } from "../../src";
import { toStringResult } from "../../src/public/SqValue";

describe("ReducerProject Tutorial", () => {
  describe("Multi source", () => {
    /*
     Case "Running multiple sources" */
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
      /* Instead of chaining the sources, we could have a dependency tree */
      /* The point here is that any source can depend on multiple sources */
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

    test("Intro to including", () => {
      /* Though it would not be practical for a storybook, 
        let's write the same project above with includes.
        You will see that parsing includes is setting the dependencies the same way as before. */
      let project = SqProject.create({ resolver: (name) => name });

      /* This time source1 and source2 are not depending on anything */
      project.setSource("source1", "x=1");
      project.setSource("source2", "y=2");

      project.setSource(
        "source3",
        `
      #include "source1"
      #include "source2"
      z=x+y`
      );
      /* We need to parse the includes to set the dependencies */
      project.parseIncludes("source3");

      /* Now we can run the project */
      project.runAll();

      /* And let's check the result and bindings of source3 
      This time you are getting all the variables because we are including the other sources 
      Behind the scenes parseIncludes is setting the dependencies */
      const result3 = project.getResult("source3");
      const bindings3 = project.getBindings("source3");

      expect(toStringResult(result3)).toBe("Ok(())");
      expect(bindings3.toString()).toBe("{z: 3}");
      /*
      Doing it like this is too verbose for a storybook 
      But I hope you have seen the relation of setContinues and parseIncludes */
      /*
         Dealing with includes needs more. 
         - There are parse errors
         - There are cyclic includes
         - And the depended source1 and source2 is not already there in the project
         - If you knew the includes before hand there would not be point of the include directive.
         More on those on the next section. */
    });
  });
});
