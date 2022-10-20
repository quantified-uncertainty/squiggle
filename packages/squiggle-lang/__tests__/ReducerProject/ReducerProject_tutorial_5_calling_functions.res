@@warning("-44")
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("ReducerProject Tutorial", () => {
  /* Let's build a project to provide a function. */
  /* But we will call that function on an array of user input. */
  let project = Project.createProject()
  Project.setSource(project, "library", "double(x) = x * 2")
  /* userCode is not here yet but its dependency is fixed. So we can set it once and for all */
  Project.setContinues(project, "userCode", ["library"])

  let userValues = [1, 2, 3, 4, 5]

  let userResults = E.A.fmap(userValues, aUserValue => {
    let userCode = `double(${aUserValue->Js.Int.toString})`
    /* Put the constructed source in the project */
    /* We have already set that it depends on "library" */
    Project.setSource(project, "userCode", userCode)
    /* Run the project */
    Project.runAll(project)
    /* Get the result */
    Project.getResult(project, "userCode")
    /* I have to remind you that the "library" is run only once and for all.
     The library is not run for each user value. */
  })

  test("userResults", () => {
    let userResultsAsString = E.A.fmap(
      userResults,
      aResult => aResult->Reducer_Value.toStringResult,
    )
    userResultsAsString->expect == ["Ok(2)", "Ok(4)", "Ok(6)", "Ok(8)", "Ok(10)"]
  })
})
