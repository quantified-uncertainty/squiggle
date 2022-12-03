import { SqProject } from "../../src";
import { toStringResult } from "../../src/public/SqValue";

describe("ReducerProject Tutorial", () => {
  /* Let's build a project to provide a function. */
  /* But we will call that function on an array of user input. */
  const project = SqProject.create();
  project.setSource("library", "double(x) = x * 2");
  /* userCode is not here yet but its dependency is fixed. So we can set it once and for all */
  project.setContinues("userCode", ["library"]);

  const userValues = [1, 2, 3, 4, 5];

  const userResults = userValues.map((aUserValue) => {
    const userCode = `double(${aUserValue})`;
    /* Put the constructed source in the project */
    /* We have already set that it depends on "library" */
    project.setSource("userCode", userCode);
    /* Run the project */
    project.runAll();
    /* Get the result */
    return project.getResult("userCode");
    /* I have to remind you that the "library" is run only once and for all.
     The library is not run for each user value. */
  });

  test("userResults", () => {
    const userResultsAsString = userResults.map(toStringResult);
    expect(userResultsAsString).toEqual([
      "Ok(2)",
      "Ok(4)",
      "Ok(6)",
      "Ok(8)",
      "Ok(10)",
    ]);
  });
});
