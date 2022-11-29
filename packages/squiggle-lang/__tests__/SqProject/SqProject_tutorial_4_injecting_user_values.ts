import { SqProject } from "../../src";
import { toStringResult } from "../../src/public/SqValue";

describe("ReducerProject Tutorial", () => {
  /* Let's build a project that depends on values from the UI */
  const project = SqProject.create();
  project.setSource("main", "x+y+z");
  /* x, y and z is not defined in the project but they has to come from the user */
  test("Injecting user values", () => {
    /* User has input the values */
    const x = 1;
    const y = 2;
    const z = 3;
    /* Then we construct a source code to define those values */
    let userCode = `
      x = ${x}
      y = ${y}
      z = ${z}
    `;
    /* We inject the user code into the project */
    project.setSource("userCode", userCode);
    /* "main" is depending on the user code */
    project.setContinues("main", ["userCode"]);
    /* We can now run the project */
    project.runAll();
    let result = project.getResult("main");
    expect(toStringResult(result)).toBe("Ok(6)");
  });
});

/* Note that this is not final version of the project */
/* In the future, for safety, we will provide a way to inject values instead of a source code */
/* But time is limited for now... */
