@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("ReducerProject Tutorial", () => {
  /* Case: Includes
In the previous tutorial we have set the similarity between setContinues and parseIncludes.
Here we will finally proceed to a real life scenario. */

  describe("parseIncludes", () => {
    /* Here we investigate the details about parseIncludes, before setting up a real life senario in the next section. */
    /* Everything happens inside a project, so let's have a project */
    let project = Project.createProject()
    Project.setSource(
      project,
      "main",
      `
    #include "common"
    x=1
    `,
    )
    /* We need to parse includes after changing the source */
    Project.parseIncludes(project, "main")
    test("getDependencies", () => {
      /* Parse includes has set the dependencies */
      Project.getDependencies(project, "main")->expect == ["common"]
      /* If there were no includes than there would be no dependencies */
      /* However if there was a syntax error at includes then would be no dependencies also */
      /* Therefore looking at dependencies is not the right way to load includes */
      /* getDependencies does not distinguish between setContinues or parseIncludes */
    })
    test("getIncludes", () => {
      /* Parse includes has set the includes */
      switch Project.getIncludes(project, "main") {
      | Ok(includes) => includes->expect == ["common"]
      | Error(err) => err->Reducer_ErrorValue.errorToString->fail
      }
      /* If the includes cannot be parsed then you get a syntax error.
      Otherwise you get the includes.
      If there is no syntax error then you can load that file and use setSource to add it to the project.
      And so on recursively... */
    })
    test("getDependents", () => {
      /* For any reason, you are able to query what other sources
        include or depend on the current source.
        But you don't need to use this to execute the projects.
        It is provided for completeness of information. */
      Project.getDependents(project, "main")->expect == []
      /* Nothing is depending on or including main */
    })

    /* Let's look at recursive and possibly cyclic includes */
    /* ... */
  })
})
