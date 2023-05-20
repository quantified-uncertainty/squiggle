import { SqProject } from "../../src/index.js";
import { toStringResult } from "../../src/public/SqValue.js";

describe("SqProject Tutorial", () => {
  /* Let's build a project to provide a function. */
  /* But we will call that function on an array of user input. */
  const project = SqProject.create();
  project.setSource("library", "double(x) = x * 2");

  const userValues = [1, 2, 3, 4, 5];

  const userResults = userValues.map((aUserValue) => {
    const userCode = `double(${aUserValue})`;
    /* Put the constructed source in the project */
    project.setSource("userCode", userCode);
    /* Set that it depends on "library" */
    project.setContinues("userCode", ["library"]);

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
