@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

Only.describe("Parse includes", () => {
  let project = Project.createProject()
  Project.setSource(
    project,
    "main",
    `
#include 'common'
x=1`,
  )
  Project.parseIncludes(project, "main")
  test("dependencies", () => {
    expect(Project.getDependencies(project, "main")) == ["common"]
  })
  test("dependents", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("getIncludes", () => {
    let mainIncludes = Project.getIncludes(project, "main")
    switch mainIncludes {
    | Ok(includes) => expect(includes) == ["common"]
    | Error(error) => fail(error->Reducer_ErrorValue.errorToString)
    }
  })
})
