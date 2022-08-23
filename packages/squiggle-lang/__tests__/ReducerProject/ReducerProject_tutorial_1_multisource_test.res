@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("ReducerProject Tutorial", () => {
  describe("Multi source", () => {
    /*
Case "Running multiple sources"
*/
    test("Chaining", () => {
      let project = Project.createProject()
      /* This time let's add 3 sources and chain them together */
      Project.setSource(project, "source1", "x=1")

      Project.setSource(project, "source2", "y=2")
      /* To run, source2 depends on source1 */
      Project.setContinues(project, "source2", ["source1"])

      Project.setSource(project, "source3", "z=3")
      /* To run, source3 depends on source2 */
      Project.setContinues(project, "source3", ["source2"])

      /* Now we can run the project */
      Project.runAll(project)

      /* And let's check the result and bindings of source3 */
      let result3 = Project.getResult(project, "source3")
      let bindings3 = Project.getBindings(project, "source3")

      (
        result3->InternalExpressionValue.toStringOptionResult,
        bindings3->InternalExpressionValue.IEvBindings->InternalExpressionValue.toString,
      )->expect == ("Ok(())", "@{x: 1,y: 2,z: 3}")
    })

    test("Depending", () => {
      /* Instead of chaining the sources, we could have a dependency tree */
      /* The point here is that any source can depend on multiple sources */
      let project = Project.createProject()

      /* This time source1 and source2 are not depending on anything */
      Project.setSource(project, "source1", "x=1")
      Project.setSource(project, "source2", "y=2")

      Project.setSource(project, "source3", "z=3")
      /* To run, source3 depends on source1 and source3 together */
      Project.setContinues(project, "source3", ["source1", "source2"])

      /* Now we can run the project */
      Project.runAll(project)

      /* And let's check the result and bindings of source3 */
      let result3 = Project.getResult(project, "source3")
      let bindings3 = Project.getBindings(project, "source3")

      (
        result3->InternalExpressionValue.toStringOptionResult,
        bindings3->InternalExpressionValue.IEvBindings->InternalExpressionValue.toString,
      )->expect == ("Ok(())", "@{x: 1,y: 2,z: 3}")
    })
  })
})
