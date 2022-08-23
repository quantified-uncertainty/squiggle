@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("ReducerProject Tutorial", () => {
  /* Let's build a project that depends on values from the UI */
  let project = Project.createProject()
  Project.setSource(project, "main", "x+y+z")
  /* x, y and z is not defined in the project but they has to come from the user */
  test("Injecting user values", () => {
    /* User has input the values */
    let x = 1
    let y = 2
    let z = 3
    /* Then we construct a source code to define those values */
    let userCode = `
      x = ${x->Js.Int.toString}
      y = ${y->Js.Int.toString}
      z = ${z->Js.Int.toString}
    `
    /* We inject the user code into the project */
    Project.setSource(project, "userCode", userCode)
    /* "main" is depending on the user code */
    Project.setContinues(project, "main", ["userCode"])
    /* We can now run the project */
    Project.runAll(project)
    let result = Project.getResult(project, "main")
    result->InternalExpressionValue.toStringOptionResult->expect == "Ok(6)"
  })
})

/* Note that this is not final version of the project */
/* In the future, for safety, we will provide a way to inject values instead of a source code */
/* But time is limited for now... */
